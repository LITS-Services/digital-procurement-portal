import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  DataSourceMode,
  DataSourceState,
  DEFAULT_DATA_SOURCE_STATE,
  normalizeDataSourceState,
  toDataSourceKey
} from './data-source.models';

const STORAGE_KEY = 'data_source_settings';

@Injectable({ providedIn: 'root' })
export class DataSourceService {
  private baseUrl = `${environment.apiUrl}/System`;

  private stateSubject = new BehaviorSubject<DataSourceState>(this.getInitialState());
  public state$ = this.stateSubject.asObservable();
  private loaded = false;

  constructor(private http: HttpClient) {}

  private getInitialState(): DataSourceState {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return normalizeDataSourceState(JSON.parse(cached));
      }
    } catch {}
    return DEFAULT_DATA_SOURCE_STATE;
  }

  get currentState(): DataSourceState {
    return this.stateSubject.value;
  }

  get mode(): DataSourceMode {
    return this.stateSubject.value.mode;
  }

  get businessCentralForms(): string[] {
    return this.stateSubject.value.businessCentralForms;
  }

  allowsCreate(formIdOrRouteOrKey: number | string | undefined | null): boolean {
    if (this.mode !== 'businessCentral') return true;
    const key = toDataSourceKey(formIdOrRouteOrKey);
    if (!key) return true;
    return !this.businessCentralForms.includes(key);
  }

  load(): Observable<DataSourceState> {
    return this.http.get<any>(`${this.baseUrl}/data-source-settings`).pipe(
      map(res => normalizeDataSourceState(res)),
      tap(state => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {}
        this.stateSubject.next(state);
        this.loaded = true;
      }),
      catchError(() => {
        return of(this.stateSubject.value);
      })
    );
  }

  save(state: DataSourceState): Observable<any> {
    const normalized = normalizeDataSourceState(state);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {}
    this.stateSubject.next(normalized);
    this.loaded = true;

    return this.http.put<any>(`${this.baseUrl}/data-source-settings`, normalized).pipe(
      tap(() => {
        this.stateSubject.next(normalized);
      })
    );
  }
}
