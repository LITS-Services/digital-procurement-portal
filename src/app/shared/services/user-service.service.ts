import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {

  // BehaviorSubject holds the latest profile picture
  private profilePictureSource = new BehaviorSubject<string>('assets/img/profile/user.png');
  profilePicture$ = this.profilePictureSource.asObservable();

  // Called from profile page when image changes
  updateProfilePicture(newPicture: string) {
    this.profilePictureSource.next(newPicture);
  }
}
