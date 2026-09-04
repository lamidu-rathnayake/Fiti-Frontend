import { loginAs } from "../support/auth_helper";

describe("Tailor Artisan Flow & Shop Management", () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.viewport(1440, 900);

        // Mock tailor profile
        cy.intercept("GET", "**/api/v1/profiles/tailor/*", {
            statusCode: 200,
            body: {
                id: "mock-tailor-456",
                full_name: "Master Artisan Perera",
                phone_number: "+94719876543",
                city: "Colombo",
                address: "Savile Atelier, Colombo",
                is_verified: true,
            },
        }).as("getTailorProfile");

        // Mock tailor shops list
        cy.intercept("GET", "**/api/v1/shops/tailor/*", {
            statusCode: 200,
            body: [
                {
                    shop_id: 101,
                    id: 101,
                    tailor_id: "mock-tailor-456",
                    shop_name: "Royal Bespoke Atelier",
                    shop_bio: "Handcrafted Luxury Suiting",
                    city: "Colombo",
                    address: "88 Galle Road, Colombo 03",
                    shop_contact_number: "+94112345678",
                    registration_number: "BR-998877",
                    is_active: true,
                    average_rating: 5.0,
                    images: [
                        { id: 201, image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35" }
                    ]
                }
            ],
        }).as("getTailorShops");
    });

    describe("Tailor Home & Dashboard (/tailor/home)", () => {
        it("displays tailor header navigation and dashboard layout", () => {
            const authOpts = loginAs("tailor");
            cy.visit("/tailor/home", authOpts);
            cy.contains("a", "Dashboard").should("be.visible");
            cy.contains("a", "Orders").should("be.visible");
        });
    });

    describe("Tailor Shop Creation (/tailor/add-shop)", () => {
        it("loads tailor shop creation page", () => {
            const authOpts = loginAs("tailor");
            cy.visit("/tailor/add-shop", authOpts);
            cy.contains(/shop/i).should("be.visible");
        });
    });

    describe("Atelier Location Setup (/tailor/location)", () => {
        it("loads tailor location management page", () => {
            const authOpts = loginAs("tailor");
            cy.visit("/tailor/location", authOpts);
            cy.contains(/location/i).should("be.visible");
        });
    });

    describe("Tailor Orders & Broadcast Market (/tailor/orders)", () => {
        it("loads tailor orders page with active orders and broadcast marketplace tabs", () => {
            cy.intercept("GET", "**/api/v1/orders/shop/*", {
                statusCode: 200,
                body: [
                    {
                        id: 701,
                        shop_id: 101,
                        client_id: "mock-client-123",
                        garment_type: "Double-Breasted Blazer",
                        total_price: 38000,
                        order_status: "in_progress",
                        created_at: "2026-03-02T14:00:00Z"
                    }
                ],
            }).as("getShopOrders");

            cy.intercept("GET", "**/api/v1/orders/requests/open", {
                statusCode: 200,
                body: [
                    {
                        id: 901,
                        client_id: "mock-client-789",
                        title: "Bespoke Linen Linen Suit",
                        description: "Need a light beige linen suit for a beach wedding.",
                        budget_min: 25000,
                        budget_max: 40000,
                        created_at: "2026-03-03T09:00:00Z"
                    }
                ],
            }).as("getOpenRequests");

            const authOpts = loginAs("tailor");
            cy.visit("/tailor/orders", authOpts);
            cy.contains(/orders/i).should("be.visible");
        });
    });
});
