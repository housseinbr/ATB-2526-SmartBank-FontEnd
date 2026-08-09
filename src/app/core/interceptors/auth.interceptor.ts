import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const isAuthEndpoint = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');

  if (token) {
    console.debug('[authInterceptor] attaching token for', req.method, req.url);
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  } else if (!isAuthEndpoint) {
    console.warn('[authInterceptor] no token for', req.method, req.url);
  }

  return next(req).pipe(
    catchError((error) => {
      // Laisse les composants gérer l'erreur. On évite de renvoyer
      // automatiquement l'utilisateur vers la page login sur un simple 401.
      return throwError(() => error);
    })
  );
};
