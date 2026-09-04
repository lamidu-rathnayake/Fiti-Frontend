describe("User Onboarding & Registration Flow", () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.viewport(1440, 900);
    });

    describe("Role Selection (/register)", () => {
        it("presents role choice between Client and Tailor", () => {
            cy.visit("/register");
            cy.contains("h1", /account type/i).should("be.visible");
            cy.contains("REGISTER AS A CLIENT").should("be.visible");
            cy.contains("REGISTER AS A SELLER").should("be.visible");
        });

        it("navigates to Client registration when Client card is selected", () => {
            cy.visit("/register");
            cy.contains("REGISTER AS A CLIENT").click();
            cy.location("pathname").should("eq", "/register/client");
        });

        it("navigates to Tailor registration when Tailor card is selected", () => {
            cy.visit("/register");
            cy.contains("REGISTER AS A SELLER").click();
            cy.location("pathname").should("eq", "/register/tailor");
        });
    });

    describe("Client Account Registration", () => {
        it("renders all client registration fields", () => {
            cy.visit("/register/client");
            cy.contains("h1", /create client account/i).should("be.visible");
            cy.get('[aria-label="Full name"]').should("be.visible");
            cy.get('[aria-label="Account email"]').should("be.visible");
            cy.get('[aria-label="Password"]').should("be.visible");
        });

        it("submits client registration form successfully", () => {
            // Intercept Firebase signup API call
            cy.intercept("POST", "**/accounts:signUp*", {
                statusCode: 200,
                body: {
                    idToken: "mock-token",
                    email: "newclient@example.com",
                    refreshToken: "mock-refresh",
                    expiresIn: "3600",
                    localId: "mock-uid-client-123",
                },
            }).as("firebaseSignUp");

            cy.intercept("POST", "**/accounts:update*", {
                statusCode: 200,
                body: {
                    localId: "mock-uid-client-123",
                    email: "newclient@example.com",
                    displayName: "Samantha Perera",
                    idToken: "mock-token",
                    refreshToken: "mock-refresh",
                    expiresIn: "3600",
                },
            });

            cy.intercept("POST", "**/securetoken.googleapis.com/**", {
                statusCode: 200,
                body: {
                    access_token: "mock-token",
                    expires_in: "3600",
                    token_type: "Bearer",
                    refresh_token: "mock-refresh",
                    id_token: "mock-token",
                    user_id: "mock-uid-client-123",
                },
            });

            // Intercept backend client profile creation API call
            cy.intercept("POST", "**/api/v1/profiles/client", {
                statusCode: 201,
                body: {
                    message: "Client profile created successfully",
                    user_id: "mock-uid-client-123",
                },
            }).as("createClientProfile");

            // Intercept role lookup API call
            cy.intercept("GET", "**/api/v1/auth/role", {
                statusCode: 200,
                body: {
                    role: "client",
                    target_url: "/client/home",
                },
            }).as("getRole");

            cy.visit("/register/client");

            cy.get('[aria-label="Full name"]').type("Samantha");
            cy.get('input[placeholder="PERERA"]').type("Perera");
            cy.get('input[placeholder="45 TEMPLE ROAD, MAHARAGAMA"]').type("45 Galle Road");
            cy.get('input[placeholder="COLOMBO"]').type("Colombo 03");
            cy.get('input[placeholder="77 123 4567"]').type("771234567");
            cy.get("select").eq(0).select("FEMALE");
            cy.get('input[placeholder="25"]').type("29");

            cy.get('[aria-label="Account email"]').type("samantha@example.com");
            cy.get('[aria-label="Password"]').type("SecurePass123!");

            cy.contains("button", /create account/i).click();

            cy.wait("@firebaseSignUp");
            cy.wait("@createClientProfile");
            cy.location("pathname", { timeout: 15000 }).should("eq", "/client/home");
        });
    });

    describe("Tailor Multi-Step Registration", () => {
        it("completes Step 1 and advances to Step 2", () => {
            cy.visit("/register/tailor");

            cy.contains(/step 01/i).should("be.visible");
            cy.get('[aria-label="Full name"]').type("Master Artisan");
            cy.get('input[placeholder="Last Name"]').type("Bandara");
            cy.get('input[placeholder="12 MAYFAIR STREET"]').type("78 Kandy Road");
            cy.get('input[placeholder="COLOMBO"]').type("Kandy");
            cy.get('textarea[placeholder*="TELL CLIENTS ABOUT YOUR EXPERTISE"]').type("30 years of bespoke tailoring experience in formal suits and ethnic wear.");
            cy.get('input[placeholder="77 900 0000"]').type("719876543");
            cy.get("select").eq(0).select("MALE");
            cy.get('input[placeholder="28"]').type("48");

            cy.contains("button", /continue to shop details/i).click();

            cy.contains(/step 02/i).should("be.visible");
            cy.get('input[placeholder="ATELIER SAVILE ROW"]').should("be.visible");
            cy.get('[aria-label="Account email"]').should("be.visible");
            cy.get('[aria-label="Password"]').should("be.visible");
        });

        it("submits multi-step tailor registration form successfully", () => {
            // Intercept Firebase signup
            cy.intercept("POST", "**/accounts:signUp*", {
                statusCode: 200,
                body: {
                    idToken: "mock-token-tailor",
                    email: "tailor@example.com",
                    refreshToken: "mock-refresh-tailor",
                    expiresIn: "3600",
                    localId: "mock-uid-tailor-456",
                },
            }).as("firebaseSignUpTailor");

            cy.intercept("POST", "**/accounts:update*", {
                statusCode: 200,
                body: {
                    localId: "mock-uid-tailor-456",
                    email: "tailor@example.com",
                    displayName: "Master Artisan Bandara",
                    idToken: "mock-token-tailor",
                    refreshToken: "mock-refresh-tailor",
                    expiresIn: "3600",
                },
            });

            // Intercept backend tailor profile creation
            cy.intercept("POST", "**/api/v1/profiles/tailor", {
                statusCode: 201,
                body: {
                    message: "Tailor profile created successfully",
                    user_id: "mock-uid-tailor-456",
                },
            }).as("createTailorProfile");

            // Intercept backend shop creation
            cy.intercept("POST", "**/api/v1/shops/", {
                statusCode: 201,
                body: {
                    id: 101,
                    tailor_id: "mock-uid-tailor-456",
                    shop_name: "Royal Bespoke Atelier",
                    city: "Kandy",
                },
            }).as("createShop");

            cy.visit("/register/tailor");

            // Fill Step 1
            cy.get('[aria-label="Full name"]').type("Master Artisan");
            cy.get('input[placeholder="Last Name"]').type("Bandara");
            cy.get('input[placeholder="12 MAYFAIR STREET"]').type("78 Kandy Road");
            cy.get('input[placeholder="COLOMBO"]').type("Kandy");
            cy.get('input[placeholder="77 900 0000"]').type("719876543");
            cy.contains("button", /continue to shop details/i).click();

            // Fill Step 2
            cy.get('input[placeholder="ATELIER SAVILE ROW"]').type("Royal Bespoke Atelier");
            cy.get('textarea[placeholder*="DESCRIBE YOUR SHOP HERITAGE"]').type("Bespoke suits, tuxedos, and traditional attire.");
            cy.get('input[placeholder="SAVILE ROW, MAIN ATELIER"]').type("78 Kandy Road, Central Province");
            cy.get('input[placeholder="77 712 3456"]').type("812233445");
            cy.get('input[placeholder="REG-123456789"]').type("BR-998877");

            cy.get('[aria-label="Account email"]').type("bandara@royalbespoke.lk");
            cy.get('[aria-label="Password"]').type("BespokeCraft2026!");

            cy.contains("button", /complete registration/i).click();

            cy.wait("@firebaseSignUpTailor");
            cy.wait("@createTailorProfile");
            cy.location("pathname", { timeout: 15000 }).should("eq", "/tailor/home");
        });
    });
});
