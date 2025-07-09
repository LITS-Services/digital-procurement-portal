import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { City, Country, State } from 'country-state-city';

@Component({
  selector: 'app-vendor-registration-form',
  templateUrl: './vendor-registration-form.component.html',
  styleUrls: ['./vendor-registration-form.component.scss']
})
export class VendorRegistrationFormComponent implements OnInit {

  vendorForm: FormGroup;
  countries = Country.getAllCountries();  // Load all countries
  states: any[] = [];   // Initialize empty states array
  cities: any[] = [];   // Initialize empty cities array

  constructor(private fb: FormBuilder) { 
    // Initialize the form with the required fields
    this.vendorForm = this.fb.group({
      organizationName: ['', Validators.required],
      companyAddress: ['', Validators.required],
      country: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', Validators.required],
      zipCode: ['', Validators.required],
      mobileNo: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Perform any initialization if necessary
  }

  // Handle form submission
  onSubmit(): void {
    if (this.vendorForm.valid) {
      console.log(this.vendorForm.value);  // Log the form data to the console
    }
  }

  // Handle country selection
  onCountryChange(event: any): void {
    const selectedCountryIsoCode = event.target.value;  // Get the selected country ISO code
    this.states = State.getStatesOfCountry(selectedCountryIsoCode);  // Fetch the states for the selected country
    this.vendorForm.patchValue({ state: '', city: '' });  // Reset the state and city fields
    this.cities = [];  // Reset the cities list
  }

  // Handle state selection
  onStateChange(event: any): void {
    const selectedStateIsoCode = event.target.value;  // Get the selected state ISO code
    const selectedCountryIsoCode = this.vendorForm.get('country')?.value;  // Get the selected country ISO code
    this.cities = City.getCitiesOfState(selectedCountryIsoCode, selectedStateIsoCode);  // Fetch the cities for the selected state
    this.vendorForm.patchValue({ city: '' });  // Reset the city field
  }

  // Handle city selection (if you need to perform any action)
  onCityChange(event: any): void {
    const selectedCity = event.target.value;  // Get the selected city (not used here, but you can add logic if needed)
  }

}
