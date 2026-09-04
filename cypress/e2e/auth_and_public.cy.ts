describe("Public Pages & Authentication Flow", () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.viewport(1440, 900);
    });

    describe("Landing & Information Pages", () => {
        it("loads the home page with header, hero banner, and key navigation links", () => {
            cy.visit("/");
            cy.contains("a", /fabrics/i).should("be.visible");
            cy.contains("a", /ateliers/i).should("be.visible");
            cy.contains("a", /how it works/i).should("be.visible");
        });

        it("toggles light and dark themes using the theme switcher", () => {
            cy.visit("/");
            cy.get('button[aria-label="Toggle theme"]').first().click();
            cy.get("html").should("have.class", "dark");
            cy.get('button[aria-label="Toggle theme"]').first().click();
            cy.get("html").should("not.have.class", "dark");
        });

        it("allows navigating to the Terms of Service page", () => {
            cy.visit("/terms");
            cy.contains("h1", /terms of service/i).should("be.visible");
            cy.contains("a", /back to home/i).should("be.visible");
        });

        it("allows navigating to the Privacy Policy page", () => {
            cy.visit("/privacy");
            cy.contains("h1", /privacy policy/i).should("be.visible");
            cy.contains("a", /back to home/i).should("be.visible");
        });

        it("handles contact form submission", () => {
            cy.visit("/contact");
            cy.contains("h1", /contact us/i).should("be.visible");

            cy.get('input[placeholder="John Doe"]').type("Test User");
            cy.get('input[placeholder="john@example.com"]').type("test@example.com");
            cy.get('input[placeholder="How can we help?"]').type("General Inquiry");
            cy.get('textarea[placeholder="Tell us more..."]').type("I would like to inquire about custom suit orders.");

            cy.contains("button", /send message/i).click();
            cy.contains("message dispatched", { matchCase: false }).should("be.visible");
        });
    });

    describe("Authentication Flow", () => {
        it("redirects an unauthenticated user attempting to access protected route to /login", () => {
            cy.visit("/client/home");
            cy.location("pathname", { timeout: 15000 }).should("eq", "/login");
        });

        it("displays authentication form with email/password inputs and submit button", () => {
            cy.visit("/login");
            cy.contains("h1", /welcome back/i).should("be.visible");
            cy.get('[aria-label="Email"]').should("be.visible");
            cy.get('[aria-label="Password"]').should("be.visible");
            cy.contains("button", /sign in/i).should("be.visible");
        });

        it("shows error alert on invalid credentials submission", () => {
            cy.intercept("POST", "**/accounts:signInWithPassword*", {
                statusCode: 400,
                body: {
                    error: {
                        code: 400,
                        message: "INVALID_LOGIN_CREDENTIALS",
                        errors: [
                            {
                                message: "INVALID_LOGIN_CREDENTIALS",
                                domain: "global",
                                reason: "invalid",
                            },
                        ],
                    },
                },
            }).as("invalidLogin");

            cy.visit("/login");
            cy.get('[aria-label="Email"]').type("wronguser@example.com");
            cy.get('[aria-label="Password"]').type("invalidpass123");
            cy.contains("button", /^sign in$/i).click();

            cy.wait("@invalidLogin");
            cy.get('[role="alert"]').should(
                "contain.text",
                "Incorrect email or password",
            );
        });

        it("navigates to registration role selection from login page", () => {
            cy.visit("/login");
            cy.contains("a", /create an account/i).click();
            cy.location("pathname").should("eq", "/register");
        });
    });
});
