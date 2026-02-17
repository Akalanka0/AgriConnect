/**
 * Centralized export for all shared services
 * This provides a single point of access for cross-module functionality
 */
export { MessageService } from './messageService.js';
export { UserService } from './userService.js';
export { DataService } from './dataService.js';

/**
 * Service factory for easy dependency injection
 */
export class ServiceFactory {
    static async getMessageService() {
        return (await import('./messageService.js')).MessageService;
    }

    static async getUserService() {
        return (await import('./userService.js')).UserService;
    }

    static async getDataService() {
        return (await import('./dataService.js')).DataService;
    }
}

export default ServiceFactory;
