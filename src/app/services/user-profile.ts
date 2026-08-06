import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfile } from '../models/user-profile';

@Injectable({
  providedIn: 'root'
})

export class UserProfileService {
    private readonly http = inject(HttpClient);

    getProfile(): Observable<UserProfile> {
        const url = `${environment.apiUrl}/user-profile`
        return this.http.get<UserProfile>(url);
    }
}
