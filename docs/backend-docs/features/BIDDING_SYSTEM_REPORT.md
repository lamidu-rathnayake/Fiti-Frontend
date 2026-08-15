# Bidding System and Direct Ordering - Developer Manual

## 1. Overview and Core Philosophy
The Fiti platform allows clients to submit custom clothing requests. To provide maximum flexibility, the system supports two primary workflows:
1. **Broadcast/Bidding Flow**: A client broadcasts a request to multiple shops, tailors submit competitive quotes (Bids), and the client selects the best offer to create an Order.
2. **Direct Shop Flow (Bid-less Order)**: A client sends a request directly to a specific shop, negotiates outside the platform (or via chat), and creates an Order directly without an official "Bid" record.

To support both workflows efficiently, the system architecture pivots around a central junction entity: the `ShopRequest`.

## 2. Architectural Flow

The domain entities flow linearly but with optional steps:

`ClothingRequest` ---> `ShopRequest` (1 to N) ---> `Bid` (Optional) ---> `Order` (1 to 1 per ShopRequest)

### The Role of `ShopRequest`
A `ShopRequest` represents a direct link between a specific `ClothingRequest` and a specific `Shop`. 
- **In Broadcast Mode**: One `ClothingRequest` generates multiple `ShopRequest` entries (one for each targeted shop).
- **In Direct Mode**: One `ClothingRequest` generates exactly one `ShopRequest`.

## 3. How the Schema Supports Bid-less Orders

The recent architectural standardization ensured that both `Bid` and `Order` models bind exclusively to the `shop_request_id` rather than to each other.

If you inspect the `schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS bids (
    bid_id           SERIAL PRIMARY KEY,
    shop_request_id  INT NOT NULL REFERENCES shop_requests(shop_request_id) ON DELETE CASCADE,
    bid_amount       NUMERIC(10,2) NOT NULL CHECK (bid_amount >= 0),
    ...
);

CREATE TABLE IF NOT EXISTS orders (
    order_id         SERIAL PRIMARY KEY,
    shop_request_id  INT NOT NULL UNIQUE REFERENCES shop_requests(shop_request_id) ON DELETE CASCADE,
    accepted_price   NUMERIC(10,2) NOT NULL,
    ...
);
```
**Key Takeaways:**
1. **`orders` does not reference `bids`**: The `order` table directly references `shop_request_id`.
2. **`accepted_price` lives on the `order`**: The final agreed price is stored directly on the order, decoupling it from a required `bid_amount`.

This means a client and a shop can agree on a price verbally or through a chat interface, and the frontend can hit the `/api/v1/orders/accept-bid` (or a logically equivalent `create-order`) endpoint using only the `shop_request_id` and the `accepted_price`. A `Bid` record is **never** strictly required by the database schema or the ORM models to generate an `Order`.

## 4. Model Creation & Data Passing Workflows

To fully understand how data moves through the Python Use Cases and SQLAlchemy Repositories, here is the exact step-by-step model creation flow for both scenarios:

### Case 1: The Bidding Process (Broadcast)
1. **Client Creates Request**: Client calls `create_clothing_request` in `manage_order.py`, providing a list of `target_shop_ids`. 
   - The Repository creates a single `ClothingRequestModel`.
   - The Repository iterates through `target_shop_ids` and creates multiple `ShopRequestModel` records.
2. **Shop Submits Quote**: Tailor calls `submit_bid` providing a `shop_request_id` and `bid_amount`.
   - The Repository creates a `BidModel` linked to the `shop_request_id`.
   - *Crucially*, the Repository also updates the `offered_price` on the parent `ShopRequestModel` to act as a "latest offer cache".
3. **Client Accepts**: Client calls `accept_bid_and_create_order` providing the `shop_request_id`.
   - The Repository creates an `OrderModel` using the `shop_request_id`.

### Case 2: Direct Shop Request (Bid-less Order)
1. **Client Creates Request**: Client calls `create_clothing_request`, providing exactly ONE `shop_id` in `target_shop_ids`.
   - The Repository creates the `ClothingRequestModel` and exactly one `ShopRequestModel`.
2. **External Negotiation**: The Client and Tailor negotiate the price via chat. No backend `submit_bid` endpoint is called.
3. **Client Accepts**: The Client calls `accept_bid_and_create_order` providing the `shop_request_id` and the manually agreed `accepted_price`.
   - The Repository creates the `OrderModel` directly. Because the database strictly requires `shop_request_id` (and not a `bid_id`), the order persists perfectly without a `BidModel` ever existing.

## 5. API Usage and Endpoints

### Submitting a Bid (Optional)
When a shop wants to submit an official quote:
- **Endpoint**: `POST /api/v1/orders/bids`
- **Payload**:
  ```json
  {
      "shop_request_id": 123,
      "bid_amount": 25000.0,
      "message": "We can finish in 3 days."
  }
  ```

### Creating an Order (With or Without a Bid)
When a client accepts a price (whether from a Bid or direct negotiation):
- **Endpoint**: `POST /api/v1/orders/accept-bid` 
  *(Note: The naming implies accepting a bid, but architecturally it creates an order from a shop request)*
- **Payload**:
  ```json
  {
      "shop_request_id": 123,
      "accepted_price": 25000.0
  }
  ```

## 6. Domain Models (`order.py`)
The Python domain models accurately reflect this schema constraint.
```python
@dataclass
class Bid:
    shop_request_id: int  # Central link
    bid_amount: float
    ...


@dataclass
class Order:
    shop_request_id: int  # Central link
    accepted_price: float
    ...
```

## 7. Compatibility Verification
The entire codebase has been verified to support this structure:
- **`SQLAlchemyOrderRepository`**: The queries in `list_orders_by_shop` and `list_orders_by_client` use `JOIN` operations on `ShopRequestModel` rather than `BidModel`, ensuring orders without bids are correctly retrieved and displayed.
- **`manage_order.py`**: The orchestration logic passes the `shop_request_id` seamlessly from DTO to Domain Entity to Repository.
- **Tests**: The in-memory test mocks (`test_use_cases.py`) operate perfectly using `shop_request_id`. Both workflows are explicitly covered:
  - `test_order_workflow_and_rating_recalc`: Covers the standard Broadcast -> Bid -> Accept Order flow.
  - `test_direct_order_workflow_without_bids`: Covers the Direct Shop Request -> Skip Bid -> Accept Order flow.

## 8. Future Considerations
Since `orders/accept-bid` technically just creates an order from a `shop_request_id`, it might be semantically clearer for future API consumers to alias or rename this endpoint to `/api/v1/orders/create` or `/api/v1/orders/accept-shop-request` if direct, bid-less flows become the dominant use-case on the platform. However, the current structural foundation natively supports it without any modifications.
