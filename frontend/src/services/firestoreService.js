/**
 * Craavyo Firestore Native Service Layer
 * 
 * Re-exports all domain-specific modular services for 100% backward compatibility:
 * - userService.js: User & Admin profile management across partitions
 * - mealService.js: Dish & Menu listings by Dayscholars
 * - orderService.js: Order placements, updates, and realtime tracking
 * - foodRequestService.js: Custom craving requests and acceptance
 * - reviewService.js: Customer reviews, ratings, and audits
 * - adminService.js: Executive governance, leader provisioning, and platform analytics
 */

export * from "./userService";
export * from "./mealService";
export * from "./orderService";
export * from "./foodRequestService";
export * from "./reviewService";
export * from "./adminService";