describe("RBAC Access Controls & System Themes", () => {
    beforeEach(() => {
        cy.clearLocalStorage();
    });

    describe("Role-Based Access Control Guards", () => {
        it("redirects client user attempting to access tailor-only routes to client home", () => {
            cy.intercept("GET", "**/api/v1/auth/role", {
                statusCode: 200,
                body: {
                    role: "client",
                    target_url: "/client/home",
                },
            }).as("getRoleClient");

            cy.visit("/tailor/orders");
            cy.location("pathname", { timeout: 15000 }).should("eq", "/client/home");
        });

        it("redirects tailor user attempting to access client-only routes to tailor home", () => {
            cy.intercept("GET", "**/api/v1/auth/role", {
                statusCode: 200,
                body: {
                    role: "tailor",
                    target_url: "/tailor/home",
                },
            }).as("getRoleTailor");

            cy.visit("/client/biddingRequest");
            cy.location("pathname", { timeout: 15000 }).should("eq", "/tailor/home");
        });
    });

    describe("Theme Context & UI Responsiveness", () => {
        it("maintains theme class state across page changes", () => {
            cy.visit("/");
            cy.get('button[aria-label="Toggle theme"]').first().click();
            cy.get("html").should("have.class", "dark");

            cy.visit("/terms");
            cy.get("html").should("have.class", "dark");
        });
    });
});
