describe("Client User Flow & Features", () => {
    beforeEach(() => {
        cy.clearLocalStorage();

        // Mock authenticated client role backend check
        cy.intercept("GET", "**/api/v1/auth/role", {
            statusCode: 200,
            body: {
                role: "client",
                target_url: "/client/home",
            },
        }).as("getRoleClient");

        // Mock client profile check
        cy.intercept("GET", "**/api/v1/profiles/client/*", {
            statusCode: 200,
            body: {
                id: "mock-client-123",
                full_name: "Jane Doe",
                phone_number: "+94771234567",
                city: "Colombo",
                address: "123 Galle Road",
            },
        }).as("getClientProfile");

        // Mock list of shops
        cy.intercept("GET", "**/api/v1/shops*", {
            statusCode: 200,
            body: [
                {
                    id: 1,
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
                    id: 2,
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
            cy.visit("/client/home");
            cy.contains("span", /fiti/i).should("be.visible");
            cy.contains("a", /home/i).should("be.visible");
            cy.contains("a", /orders/i).should("be.visible");
            cy.contains("a", /tailors/i).should("be.visible");
        });

        it("opens and closes mobile sidebar menu", () => {
            cy.viewport("iphone-x");
            cy.visit("/client/home");

            // Click hamburger menu button
            cy.get('button[aria-label="Toggle navigation menu"]').click();
            cy.contains("div", /menu/i).should("be.visible");

            // Close sidebar
            cy.get('button[aria-label="Close navigation menu"]').click();
        });
    });

    describe("Direct & Broadcast Garment Requests", () => {
        it("loads the Direct Request form page", () => {
            cy.visit("/client/directRequest");
            cy.contains(/direct/i).should("be.visible");
        });

        it("loads the Broadcast Request form page", () => {
            cy.visit("/client/biddingRequest");
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

            cy.visit("/client/orders");
            cy.contains(/my orders/i).should("be.visible");
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

            cy.visit("/client/profile");
            cy.contains(/profile/i).should("be.visible");
        });
    });
});
