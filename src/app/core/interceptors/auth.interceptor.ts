import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    console.debug('[authInterceptor] attaching token for', req.method, req.url);
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  } else {
    console.warn('[authInterceptor] no token for', req.method, req.url);
  }

  return next(req).pipe(
    catchError((error) => {
      return throwError(() => error);
    })
  );
};
