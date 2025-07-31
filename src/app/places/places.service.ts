import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap, Subscription, throwError } from 'rxjs';

import { Place } from './place.model';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private httpClient = inject(HttpClient);
  private userPlaces = signal<Place[]>([]);

  loadedUserPlaces = this.userPlaces.asReadonly();

  loadAvailablePlaces() {
    return this.fetchPlaces('http://localhost:3000/places',
      'Something went wrong fetching available places. Please try again later...')
  }

  loadUserPlaces() {
    return this.fetchPlaces('http://localhost:3000/user-places',
      'Something went wrong fetching your favorite places. Please try again later...')
      .pipe(
        tap({
          next: (userPlaces) => this.userPlaces.set(userPlaces),
        })
      );
  }

  addPlaceToUserPlaces(place: Place) {
    const prevPlaces = this.userPlaces();

    if (!prevPlaces.some(prevPlace => prevPlace.id === place.id)) {
      this.userPlaces.set([...prevPlaces, place]);
    }


    return this.httpClient
      .put('http://localhost:3000/user-places', {
        placeId: place.id,
      })
      .pipe(
        catchError((error) => {
          this.userPlaces.set(prevPlaces);
          return throwError(() => new Error('Failed to store selected Place.'))
        })
      );
  }

  removeUserPlace(place: Place) {
    const prevPlaces = this.userPlaces();

    if (prevPlaces.some(prevPlace => prevPlace.id === place.id)) {
      this.userPlaces.set(prevPlaces.filter(prevPlace => prevPlace.id !== place.id));
    }

    return this.httpClient
      .delete(`http://localhost:3000/user-places/${place.id}`)
      .pipe(
        catchError(error => {
          this.userPlaces.set(prevPlaces);
          return throwError(() => new Error('Failed to remove the selected place.'))
        })
      );
  }

  private fetchPlaces(url: string, errorMessage: string) {
    return this.httpClient
      .get<{ places: Place[] }>(url)
      .pipe(
        map((resData) => resData.places),
        catchError((error) => {
          return throwError(
            () =>
              new Error(errorMessage)
          );
        })
      );
  }
}
