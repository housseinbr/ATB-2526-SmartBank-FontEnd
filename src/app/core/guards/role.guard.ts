import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/role';

export const roleGuard = (...allowedRoles: Role[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    const userRole = authService.role();
    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // Redirection vers le bon dashboard si mauvais rôle
    if (userRole) {
      switch (userRole) {
        case Role.ADMIN:
          router.navigate(['/dashboard/admin']);
          break;
        case Role.SUPERVISEUR:
          router.navigate(['/dashboard/superviseur']);
          break;
        case Role.EMPLOYE:
          router.navigate(['/dashboard/employe']);
          break;
      }
    }

    return false;
  };
};
