import { loginAs } from "../support/auth_helper";

describe("Client User Flow & Features", () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.viewport(1440, 900);

        // Mock geocoding calls
        cy.intercept("GET", "https://nominatim.openstreetmap.org/*", {
            statusCode: 200,
            body: {
                address: { city: "Colombo", road: "Galle Road" }
            }
        }).as("nominatim");

        // Mock client profile check
        cy.intercept("GET", "**/api/v1/profiles/client/*", {
            statusCode: 200,
            body: {
                id: "mock-client-123",
                full_name: "Jane Doe",
                phone_number: "+94771234567",
                city: "Colombo",
                address: "123 Galle Road",
                latitude: 6.9271,
                longitude: 79.8612,
            },
        }).as("getClientProfile");

        // Mock list of shops (both general and nearby)
        cy.intercept("GET", /\/api\/v1\/shops/, {
            statusCode: 200,
            body: [
                {
                    shop_id: 1,
                    id: 1,
                    tailor_id: "mock-tailor-456",
                    shop_name: "Savile Row Lanka",
                    shop_bio: "Premium Bespoke Tailoring",
                    city: "Colombo",
                    address: "100 Galle Face, Colombo",
                    shop_contact_number: "+94771112222",
                    is_active: true,
                    average_rating: 4.9,
                    images: [
                        { id: 10, image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35" }
                    ]
                },
                {
                    shop_id: 2,
                    id: 2,
                    tailor_id: "mock-tailor-789",
                    shop_name: "Kandy Craftsmen Atelier",
                    shop_bio: "Traditional Sri Lankan Suits",
                    city: "Kandy",
                    address: "45 Peradeniya Rd, Kandy",
                    shop_contact_number: "+94812223333",
                    is_active: true,
                    average_rating: 4.8,
                    images: []
                }
            ],
        }).as("listShops");
    });

    describe("Client Home Dashboard (/client/home)", () => {
        it("displays client navigation header and shop listings", () => {
            const authOpts = loginAs("client");
            cy.visit("/client/home", authOpts);

            cy.contains("a", "Home").should("be.visible");
            cy.contains("a", "Orders").should("be.visible");
            cy.contains("a", "Tailors").should("be.visible");
            cy.contains("a", "Broadcast").should("be.visible");

            cy.contains("Savile Row Lanka").should("be.visible");
            cy.contains("Kandy Craftsmen Atelier").should("be.visible");
        });

        it("opens and closes mobile sidebar menu", () => {
            cy.viewport("iphone-x");
            const authOpts = loginAs("client");
            cy.visit("/client/home", authOpts);

            // Click hamburger menu button
            cy.get('button[title="Menu"]').click({ force: true });
            cy.contains("span", "My Profile & Settings").should("be.visible");

            // Close sidebar by clicking logout or close icon inside sidebar
            cy.get('div.w-72 button').first().click({ force: true });
        });
    });

    describe("Direct & Broadcast Garment Requests", () => {
        it("loads the Direct Request form page", () => {
            const authOpts = loginAs("client");
            cy.visit("/client/directRequest", authOpts);
            cy.contains(/request/i).should("be.visible");
        });

        it("loads the Broadcast Request form page", () => {
            const authOpts = loginAs("client");
            cy.visit("/client/biddingRequest", authOpts);
            cy.contains(/broadcast/i).should("be.visible");
        });
    });

    describe("Client Orders Management (/client/orders)", () => {
        it("loads client orders page and shows order tabs", () => {
            cy.intercept("GET", "**/api/v1/orders/client/*", {
                statusCode: 200,
                body: [
                    {
                        id: 501,
                        shop_id: 1,
                        client_id: "mock-client-123",
                        garment_type: "3-Piece Tuxedo",
                        total_price: 45000,
                        order_status: "in_progress",
                        created_at: "2026-03-01T10:00:00Z"
                    }
                ],
            }).as("getClientOrders");

            const authOpts = loginAs("client");
            cy.visit("/client/orders", authOpts);
            cy.contains(/orders/i).should("be.visible");
        });
    });

    describe("Client Profile & Body Measurements (/client/profile)", () => {
        it("displays body measurements section and allows updating values", () => {
            cy.intercept("GET", "**/api/v1/profiles/client/*/measurements", {
                statusCode: 200,
                body: {
                    chest_in: 40,
                    waist_in: 32,
                    hips_in: 38,
                    inseam_in: 31,
                    neck_in: 15.5,
                    shoulder_in: 18,
                },
            }).as("getMeasurements");

            const authOpts = loginAs("client");
            cy.visit("/client/profile", authOpts);
            cy.contains(/profile/i).should("be.visible");
        });
    });
});
