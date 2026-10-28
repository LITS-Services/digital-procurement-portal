import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../../core/language/language.service';
import { AppLanguage } from '../../../core/language/language.types';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: false
})
export class MainLayoutComponent implements OnInit {
  langOpen = false;

  constructor(public languageService: LanguageService) { }

  ngOnInit(): void {
  }

  get currentLang(): AppLanguage {
    return this.languageService.current();
  }

  switchLanguage(lang: 'en' | 'ar'): void {
    sessionStorage.setItem('login_selected_lang', lang);
    this.languageService.setLanguage(lang, false).subscribe();
  }

}
