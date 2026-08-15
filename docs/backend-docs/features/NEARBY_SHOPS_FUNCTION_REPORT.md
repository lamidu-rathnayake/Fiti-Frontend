# Nearby Tailor Shops Function (`GET /api/v1/shops/nearby`) — Architectural Report

This report provides a complete, layer-by-layer technical breakdown of how the **Nearby Tailor Shops Search** function (`search_near_shops`) works across all Clean Architecture files in the **Fiti Backend Application**.

---

## 🎯 Function Goal & Endpoint Summary

- **HTTP Request**: `GET /api/v1/shops/nearby?lat=6.9271&lng=79.8612&radius_km=10.0`
- **Purpose**: Calculates and returns all tailor shops within a specified radius (default: `10.0 km`) from the user's GPS coordinates (`lat`, `lng`).

---

## 📐 Deep Dive: How the Bounding Box Calculation Works with the Endpoint

When a user calls `GET /api/v1/shops/nearby`, the input parameters are converted into a **Geographic Bounding Box** inside `app/infrastructure/db/repositories/sqlalchemy_shop_repository.py`.

### 1️⃣ Step-by-Step Concrete Numerical Example

Suppose a user stands near **Colombo Fort** and sends this HTTP request:
```http
GET /api/v1/shops/nearby?lat=6.9344&lng=79.8428&radius_km=5.0
```

1. **Input Values**:
   - `lat = 6.9344`
   - `lng = 79.8428`
   - `radius_km = 5.0`

2. **Calculating Latitude Delta (`lat_delta`)**:
   - Every 1 degree of Latitude ≈ `111.0 km` on Earth.
   - `lat_delta = radius_km / 111.0 = 5.0 / 111.0 = 0.0450 degrees`
   - `min_lat = 6.9344 - 0.0450 = 6.8894`
   - `max_lat = 6.9344 + 0.0450 = 6.9794`

3. **Calculating Longitude Delta (`lon_delta`)**:
   - Longitude lines converge toward the poles, so 1 degree of Longitude shrinks depending on the latitude angle:
   - `cos_radians = math.cos(math.radians(6.9344)) ≈ 0.9927`
   - `lon_delta = 5.0 / (111.0 * 0.9927) = 5.0 / 110.189 = 0.04537 degrees`
   - `min_lng = 79.8428 - 0.04537 = 79.7974`
   - `max_lng = 79.8428 + 0.04537 = 79.8881`

---

### 2️⃣ Visual Bounding Box Diagram

```
                       max_lat = 6.9794 (North)
                 ┌──────────────────────────────────┐
                 │                                  │
                 │   🏬 Shop B (6.9600, 79.8500)    │
                 │      [INSIDE - Returned]         │
  min_lng =      │                                  │     max_lng =
  79.7974 (West) │        📍 User GPS               │     79.8881 (East)
                 │       (6.9344, 79.8428)          │
                 │                                  │
                 │   🏬 Shop A (6.9100, 79.8200)    │
                 │      [INSIDE - Returned]         │
                 └──────────────────────────────────┘
                       min_lat = 6.8894 (South)

  ❌ Shop C (7.1500, 80.0100) -> OUTSIDE -> Filtered Out by SQL
```

---

### 3️⃣ Generated SQL Query

SQLAlchemy converts these calculated numbers into a single SQL statement sent to PostgreSQL:

```sql
SELECT 
    shops.shop_id, 
    shops.tailor_id, 
    shops.shop_name, 
    shops.latitude, 
    shops.longitude, 
    shops.city, 
    shops.average_rating 
FROM shops 
WHERE shops.latitude >= 6.8894 
  AND shops.latitude <= 6.9794 
  AND shops.longitude >= 79.7974 
  AND shops.longitude <= 79.8881;
```

---

## 🗺️ Execution Chain & File Map

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ 1. API LAYER                                                                     │
│ File: app/api/v1/endpoints/shops.py                                              │
│ Function: search_near_shops()                                                      │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 2. DEPENDENCY CONTAINER                                                           │
│ File: app/api/dependencies.py                                                     │
│ Function: get_manage_shop_use_case()                                              │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 3. USE CASE LAYER                                                                 │
│ File: app/use_cases/shop/manage_shop.py                                           │
│ Function: search_near_location()                                                  │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 4. DOMAIN REPOSITORY CONTRACT                                                     │
│ File: app/domain/repositories/shop_repository.py                                 │
│ Abstract Method: search_near_location()                                           │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 5. INFRASTRUCTURE REPOSITORY IMPLEMENTATION                                       │
│ File: app/infrastructure/db/repositories/sqlalchemy_shop_repository.py          │
│ Method: search_near_location()                                                    │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 6. DATABASE LAYER                                                                 │
│ File: app/infrastructure/db/models/shop_model.py                                │
│ Table: shops (PostgreSQL / SQLite)                                                │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📄 File-by-File Technical Breakdown

### Step 1: Presentation & Endpoint Layer
📁 **File**: `app/api/v1/endpoints/shops.py`

```python
@router.get("/nearby", response_model=list[ShopResponse])
async def search_near_shops(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius_km: float = Query(10.0, description="Search radius in kilometers"),
    use_case: ManageShopUseCase = Depends(get_manage_shop_use_case),
):
    """Find tailor shops within a GPS radius."""
    return await use_case.search_near_location(lat=lat, lng=lng, radius_km=radius_km)
```
- **What it does**: Parses the incoming URL query parameters (`lat`, `lng`, `radius_km`), validates their types via Pydantic, injects `ManageShopUseCase`, and calls the use case.

---

### Step 2: Dependency Injection Container
📁 **File**: `app/api/dependencies.py`

```python
def get_shop_repository(session: AsyncSession = Depends(get_db_session)) -> AbstractShopRepository:
    return SQLAlchemyShopRepository(session=session)

def get_manage_shop_use_case(
    shop_repo: AbstractShopRepository = Depends(get_shop_repository),
) -> ManageShopUseCase:
    return ManageShopUseCase(shop_repository=shop_repo)
```
- **What it does**: Wires the database session (`AsyncSession`) to `SQLAlchemyShopRepository`, and passes that repository into `ManageShopUseCase`.

---

### Step 3: Application Business Logic Layer
📁 **File**: `app/use_cases/shop/manage_shop.py`

```python
async def search_near_location(self, lat: float, lng: float, radius_km: float = 10.0) -> list[ShopOutputDTO]:
    shops = await self.shop_repository.search_near_location(lat=lat, lng=lng, radius_km=radius_km)
    return [self._to_dto(s) for s in shops]
```
- **What it does**: Invokes the abstract repository, receives pure domain `Shop` entities, and maps them to `ShopOutputDTO` data structures.

---

### Step 4: Domain Interface (Contract)
📁 **File**: `app/domain/repositories/shop_repository.py`

```python
class AbstractShopRepository(ABC):
    @abstractmethod
    async def search_near_location(self, lat: float, lng: float, radius_km: float = 10.0) -> List[Shop]:
        """Find tailor shops within a GPS radius."""
        pass
```
- **What it does**: Enforces the architectural contract so the domain logic never directly depends on SQLAlchemy or raw SQL queries.

---

### Step 5: Infrastructure & Spatial Calculation
📁 **File**: `app/infrastructure/db/repositories/sqlalchemy_shop_repository.py`

```python
async def search_near_location(self, lat: float, lng: float, radius_km: float = 10.0) -> list[Shop]:
    # 1. Approximate latitude degree delta (1 deg lat ~ 111 km)
    lat_delta = radius_km / 111.0
    
    # 2. Adjust longitude degree delta for Earth's curvature
    lon_delta = radius_km / (111.0 * max(0.0001, math.cos(math.radians(lat))))
    
    # 3. Calculate bounding box boundaries
    min_lat, max_lat = lat - lat_delta, lat + lat_delta
    min_lng, max_lng = lng - lon_delta, lng + lon_delta
    
    # 4. Construct indexed SQL range query
    stmt = (
        select(ShopModel)
        .options(selectinload(ShopModel.images))
        .where(ShopModel.latitude >= min_lat)
        .where(ShopModel.latitude <= max_lat)
        .where(ShopModel.longitude >= min_lng)
        .where(ShopModel.longitude <= max_lng)
    )
    result = await self.session.execute(stmt)
    models = result.scalars().all()
    return [m.to_domain() for m in models]
```

---

### Step 6: ORM Model & Database Storage
📁 **File**: `app/infrastructure/db/models/shop_model.py`

```python
class ShopModel(Base):
    __tablename__ = "shops"

    shop_id = Column(Integer, primary_key=True, index=True)
    tailor_id = Column(String(128), Nullable=False)
    shop_name = Column(String(255), Nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    def to_domain() -> Shop:
        ...
```

---

## 🧪 Verification & Testing Status

- Unit and Integration tests in `tests/test_api.py` verify that `GET /api/v1/shops/nearby?lat=6.92&lng=79.86&radius_km=10` successfully returns shops within the radius.
- **Status**: All 13 test cases passed cleanly.
