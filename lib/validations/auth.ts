import { z } from "zod";

// Sri Lankan phone number format: +94771234567 or 0771234567
const slPhoneRegex = /^(?:0|\+94)[ \-]?(?:[0-9][ \-]?){9}$/;

const slPhoneSchema = z.string()
    .refine((val) => !val || slPhoneRegex.test(val.trim()), {
        message: "Please enter a valid Sri Lankan phone number (e.g. 0771234567).",
    })
    .optional();

export const clientRegisterSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
    phone: slPhoneSchema,
    city: z.string().min(2, "City is required."),
    address: z.string().min(5, "Address must be at least 5 characters long.").optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

export const tailorRegisterSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
    phone: slPhoneSchema,
    city: z.string().optional(),
    address: z.string().min(5, "Address must be at least 5 characters long.").optional().or(z.literal('')),
    
    shopName: z.string().min(2, "Shop Name must be between 2 and 150 characters.").max(150, "Shop Name must be between 2 and 150 characters."),
    specialty: z.string().min(2, "Specialty is required."),
    shopBio: z.string().max(500, "Shop bio cannot exceed 500 characters.").optional(),
    registrationNumber: z.string().optional(),
    
    shopPhone: slPhoneSchema,
    shopCity: z.string().optional(),
    shopAddress: z.string().min(5, "Address must be at least 5 characters long.").optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

export const onboardingClientSchema = z.object({
    displayName: z.string().min(2, "Name is required."),
    phone: slPhoneSchema,
    city: z.string().min(2, "City is required."),
    address: z.string().min(5, "Address must be at least 5 characters long.").optional().or(z.literal('')),
});

export const onboardingTailorSchema = z.object({
    displayName: z.string().min(2, "Name is required."),
    phone: slPhoneSchema,
    city: z.string().min(2, "City is required."),
    address: z.string().min(5, "Address must be at least 5 characters long.").optional().or(z.literal('')),
    
    shopName: z.string().min(2, "Shop Name must be between 2 and 150 characters.").max(150, "Shop Name must be between 2 and 150 characters."),
    specialty: z.string().min(2, "Specialty is required."),
    shopBio: z.string().max(500, "Shop bio cannot exceed 500 characters.").optional(),
    registrationNumber: z.string().optional(),
    
    shopPhone: slPhoneSchema,
    shopCity: z.string().optional(),
    shopAddress: z.string().min(5, "Address must be at least 5 characters long.").optional().or(z.literal('')),
});
