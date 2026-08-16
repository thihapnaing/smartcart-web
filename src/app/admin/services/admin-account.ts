import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminAccount, CreateAdminRequest } from '../models/admin-account';

// AUTHOR: Htet Nandar(Grace)
@Injectable({
  providedIn: 'root',
})
export class AdminAccountService {
  private readonly apiBase = `${environment.apiUrl}/admin/admins`;

  constructor(private readonly http: HttpClient) {}

  getAllAdmins(): Observable<AdminAccount[]> {
    return this.http.get<AdminAccount[]>(this.apiBase);
  }

  createAdmin(request: CreateAdminRequest): Observable<AdminAccount> {
    return this.http.post<AdminAccount>(this.apiBase, request);
  }
}
