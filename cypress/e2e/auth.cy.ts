describe("Authentication and routing flows", () => {
    beforeEach(() => {
        cy.clearLocalStorage();
    });

    it("redirects an unauthenticated user from a protected route", () => {
        cy.visit("/client/home");
        cy.location("pathname", { timeout: 15000 }).should("eq", "/login");
    });

    it("shows an error for invalid credentials", () => {
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
        cy.get('[aria-label="Email"]').type("invalid@example.com");
        cy.get('[aria-label="Password"]').type("wrongpassword123");
        cy.contains("button", /^sign in$/i).click();

        cy.wait("@invalidLogin");
        cy.get('[role="alert"]').should(
            "contain.text",
            "Incorrect email or password",
        );
    });

    it("loads the client registration page", () => {
        cy.visit("/register/client");

        cy.contains("h1", /create client account/i).should("be.visible");
        cy.get('[aria-label="Full name"]').should("be.visible");
        cy.contains("button", /create account/i).should("be.visible");
    });

    it("loads the first tailor registration step", () => {
        cy.visit("/register/tailor");

        cy.contains("h1", /create personal profile/i).should("be.visible");
        cy.get('[aria-label="Full name"]').should("be.visible");
        cy.contains("button", /continue to shop details/i).should("be.visible");
    });
});