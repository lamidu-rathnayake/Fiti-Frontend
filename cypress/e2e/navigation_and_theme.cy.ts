import { loginAs } from "../support/auth_helper";

describe("RBAC Access Controls & System Themes", () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.viewport(1440, 900);
    });

    describe("Role-Based Access Control Guards", () => {
        it("redirects client user attempting to access tailor-only routes to client home", () => {
            const authOpts = loginAs("client");
            cy.visit("/tailor/orders", authOpts);
            cy.location("pathname", { timeout: 15000 }).should("eq", "/client/home");
        });

        it("redirects tailor user attempting to access client-only routes to tailor home", () => {
            const authOpts = loginAs("tailor");
            cy.visit("/client/biddingRequest", authOpts);
            cy.location("pathname", { timeout: 15000 }).should("eq", "/tailor/home");
        });
    });

    describe("Theme Context & UI Responsiveness", () => {
        it("allows theme switching on protected app routes and forces light theme on public routes", () => {
            cy.intercept("GET", "**/api/v1/profiles/client/*", {
                statusCode: 200,
                body: { id: "mock-client-123", full_name: "Jane Doe" },
            }).as("getClientProfile");
            cy.intercept("GET", /\/api\/v1\/shops/, { statusCode: 200, body: [] }).as("getShops");

            const authOpts = loginAs("client");
            cy.visit("/client/home", authOpts);
            cy.wait("@getClientProfile");
            cy.wait("@getShops");

            cy.get('header button[aria-label="Toggle Light and Dark Theme"]').click();
            cy.get("html").should("have.class", "dark");

            // Navigating to a public route enforces light mode
            cy.visit("/terms");
            cy.get("html").should("not.have.class", "dark");
        });
    });
});
