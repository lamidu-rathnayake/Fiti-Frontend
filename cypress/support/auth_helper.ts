export function loginAs(role: "client" | "tailor") {
    const apiKey = "AIzaSyBGbesTxWPOqshyBogCuUjS8pccJWitTdQ";
    const mockUser = {
        uid: "test-user-uid-12345",
        email: role === "client" ? "client@example.com" : "tailor@example.com",
        emailVerified: true,
        isAnonymous: false,
        displayName: role === "client" ? "Test Client" : "Test Tailor",
        providerData: [
            {
                providerId: "password",
                uid: role === "client" ? "client@example.com" : "tailor@example.com",
                displayName: role === "client" ? "Test Client" : "Test Tailor",
                email: role === "client" ? "client@example.com" : "tailor@example.com",
                phoneNumber: null,
                photoURL: null,
            },
        ],
        stsTokenManager: {
            refreshToken: "mock-refresh-token",
            accessToken: "mock-access-token",
            expirationTime: 9999999999999,
        },
        createdAt: "1600000000000",
        lastLoginAt: "1600000000000",
        apiKey: apiKey,
        appName: "[DEFAULT]",
    };

    cy.intercept("GET", "**/api/v1/auth/me/role*", {
        statusCode: 200,
        body: { role: role },
    }).as("getMyRole");

    cy.intercept("GET", "**/api/v1/auth/role*", {
        statusCode: 200,
        body: { role: role },
    }).as("getRole");

    cy.intercept("POST", "**/identitytoolkit.googleapis.com/**", {
        statusCode: 200,
        body: {
            users: [
                {
                    localId: "test-user-uid-12345",
                    email: role === "client" ? "client@example.com" : "tailor@example.com",
                    emailVerified: true,
                },
            ],
        },
    });

    return {
        onBeforeLoad(win: Window) {
            win.sessionStorage.setItem(
                `firebase:authUser:${apiKey}:[DEFAULT]`,
                JSON.stringify(mockUser),
            );
        },
    };
}
