import React, { useState, useMemo } from 'react';
import { useKeystrokeLogger } from '../../hooks/useKeystrokeLogger';
import { KeystrokeDataDisplay } from '../KeystrokeDataDisplay';

interface LyingTestProps {
  onShowData: () => void;
  onClearData: () => void;
  showData: boolean;
}

interface FormData {
  // Identity
  firstName: string;
  lastName: string;
  
  // Physical characteristics
  gender: string;
  weight: string;
  height: string;
  eyeColor: string;
  hairColor: string;
  shoeSize: string;
  
  // Birth
  age: string;
  dayOfBirth: string;
  monthOfBirth: string;
  yearOfBirth: string;
  zodiacSign: string;
  birthRegion: string;
  birthProvince: string;
  birthCity: string;
  citizenship: string;
  nativeLanguage: string;
  
  // Residence
  residenceRegion: string;
  residenceProvince: string;
  residenceCity: string;
  residenceAddress: string;
  
  // Contacts
  email: string;
  phoneNumber: string;
  phoneProvider: string;
  
  // Education
  primarySchoolName: string;
  middleSchoolName: string;
  highSchoolName: string;
  highSchoolCity: string;
  highSchoolGradMark: string;
  universityLocation: string;
  universityDepartment: string;
  universityFaculty: string;
  
  // Interests
  mobilePhoneBrand: string;
  mobilePhoneColor: string;
  carBrand: string;
  carColor: string;
  practicedSports: string;
  instrumentsPlayed: string;
  animalsOwned: string;
  holidayCities: string;
  newYearCities: string;
  
  // Relatives and friends
  motherFirstName: string;
  motherLastName: string;
  fatherFirstName: string;
  grandparentName: string;
  familyMemberName: string;
  lastPartnerName: string;
  closeFriendName: string;
}

type FieldMode = 'truth' | 'lie';

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-indigo-200">
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const InputField = ({ 
  label, 
  field, 
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  mode 
}: { 
  label: string; 
  field: string; 
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  mode: FieldMode;
}) => {
  const isTruth = mode === 'truth';
  
  return (
    <div>
      <label className={`block text-sm font-medium mb-1 ${isTruth ? 'text-green-700' : 'text-red-700'}`}>
        {label} {isTruth ? '✓ (Tell Truth)' : '✗ (Tell Lie)'}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        className={`w-full p-2 border-2 rounded-lg focus:ring-2 outline-none transition-all ${
          isTruth 
            ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-200' 
            : 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
        }`}
      />
    </div>
  );
};

export function LyingTest({ onShowData, onClearData, showData }: LyingTestProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', gender: '', weight: '', height: '', eyeColor: '',
    hairColor: '', shoeSize: '', age: '', dayOfBirth: '', monthOfBirth: '',
    yearOfBirth: '', zodiacSign: '', birthRegion: '', birthProvince: '',
    birthCity: '', citizenship: '', nativeLanguage: '', residenceRegion: '',
    residenceProvince: '', residenceCity: '', residenceAddress: '', email: '',
    phoneNumber: '', phoneProvider: '', primarySchoolName: '', middleSchoolName: '',
    highSchoolName: '', highSchoolCity: '', highSchoolGradMark: '',
    universityLocation: '', universityDepartment: '', universityFaculty: '',
    mobilePhoneBrand: '', mobilePhoneColor: '', carBrand: '', carColor: '',
    practicedSports: '', instrumentsPlayed: '', animalsOwned: '', holidayCities: '',
    newYearCities: '', motherFirstName: '', motherLastName: '', fatherFirstName: '',
    grandparentName: '', familyMemberName: '', lastPartnerName: '', closeFriendName: ''
  });

  // Randomly assign truth/lie to each field (memoized so it doesn't change on re-render)
  const fieldModes = useMemo(() => {
    const fields = Object.keys(formData) as (keyof FormData)[];
    const modes: Record<string, FieldMode> = {};
    
    fields.forEach(field => {
      modes[field] = Math.random() > 0.5 ? 'truth' : 'lie';
    });
    
    return modes;
  }, []); // Empty dependency array means this only runs once

  const { logKeyDown, logKeyUp, clearLogs, getLogs, getAnalytics, exportAsJSON, exportAsCSV } = useKeystrokeLogger();

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleClear = () => {
    setFormData({
      firstName: '', lastName: '', gender: '', weight: '', height: '', eyeColor: '',
      hairColor: '', shoeSize: '', age: '', dayOfBirth: '', monthOfBirth: '',
      yearOfBirth: '', zodiacSign: '', birthRegion: '', birthProvince: '',
      birthCity: '', citizenship: '', nativeLanguage: '', residenceRegion: '',
      residenceProvince: '', residenceCity: '', residenceAddress: '', email: '',
      phoneNumber: '', phoneProvider: '', primarySchoolName: '', middleSchoolName: '',
      highSchoolName: '', highSchoolCity: '', highSchoolGradMark: '',
      universityLocation: '', universityDepartment: '', universityFaculty: '',
      mobilePhoneBrand: '', mobilePhoneColor: '', carBrand: '', carColor: '',
      practicedSports: '', instrumentsPlayed: '', animalsOwned: '', holidayCities: '',
      newYearCities: '', motherFirstName: '', motherLastName: '', fatherFirstName: '',
      grandparentName: '', familyMemberName: '', lastPartnerName: '', closeFriendName: ''
    });
    clearLogs();
    onClearData();
  };

  const renderInputField = (label: string, field: keyof FormData) => (
    <InputField
      label={label}
      field={field}
      value={formData[field]}
      onChange={handleInputChange(field)}
      onKeyDown={logKeyDown as any}
      onKeyUp={logKeyUp as any}
      mode={fieldModes[field]}
    />
  );

  return (
    <div>
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 via-yellow-50 to-red-50 rounded-lg border-2 border-yellow-300">
        <h3 className="font-semibold text-gray-800 mb-2">🎭 Lying Detection Test</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Fill out the form below following these rules:
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 bg-green-100 border border-green-300 rounded font-semibold text-green-800">
              ✓ Green = Tell the TRUTH
            </span>
            <span className="px-3 py-1 bg-red-100 border border-red-300 rounded font-semibold text-red-800">
              ✗ Red = Tell a LIE
            </span>
          </div>
          <p className="text-xs text-gray-600 italic">
            The colors are randomly assigned. Switch between truth and lies as indicated by the field colors.
          </p>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto pr-2">
        <FormSection title="Identity">
          {renderInputField("First Name", "firstName")}
          {renderInputField("Last Name", "lastName")}
        </FormSection>

        <FormSection title="Physical Characteristics">
          {renderInputField("Gender", "gender")}
          {renderInputField("Weight (kg)", "weight")}
          {renderInputField("Height (cm)", "height")}
          {renderInputField("Eye Color", "eyeColor")}
          {renderInputField("Hair Color", "hairColor")}
          {renderInputField("Shoe Size", "shoeSize")}
        </FormSection>

        <FormSection title="Birth Information">
          {renderInputField("Age", "age")}
          {renderInputField("Day of Birth", "dayOfBirth")}
          {renderInputField("Month of Birth", "monthOfBirth")}
          {renderInputField("Year of Birth", "yearOfBirth")}
          {renderInputField("Zodiac Sign", "zodiacSign")}
          {renderInputField("Birth Region", "birthRegion")}
          {renderInputField("Birth Province", "birthProvince")}
          {renderInputField("Birth City", "birthCity")}
          {renderInputField("Citizenship", "citizenship")}
          {renderInputField("Native Language", "nativeLanguage")}
        </FormSection>

        <FormSection title="Residence">
          {renderInputField("Region", "residenceRegion")}
          {renderInputField("Province", "residenceProvince")}
          {renderInputField("City", "residenceCity")}
          {renderInputField("Address", "residenceAddress")}
        </FormSection>

        <FormSection title="Contacts">
          {renderInputField("Email", "email")}
          {renderInputField("Phone Number", "phoneNumber")}
          {renderInputField("Phone Service Provider", "phoneProvider")}
        </FormSection>

        <FormSection title="Education">
          {renderInputField("Primary School City", "primarySchoolName")}
          {renderInputField("Middle School City", "middleSchoolName")}
          {renderInputField("High School Name", "highSchoolName")}
          {renderInputField("High School City", "highSchoolCity")}
          {renderInputField("Graduation Mark", "highSchoolGradMark")}
          {renderInputField("University Location", "universityLocation")}
          {renderInputField("Department", "universityDepartment")}
          {renderInputField("Faculty Attended", "universityFaculty")}
        </FormSection>

        <FormSection title="Interests">
          {renderInputField("Mobile Phone Brand", "mobilePhoneBrand")}
          {renderInputField("Mobile Phone Color", "mobilePhoneColor")}
          {renderInputField("Car Brand", "carBrand")}
          {renderInputField("Car Color", "carColor")}
          {renderInputField("Practiced Sports", "practicedSports")}
          {renderInputField("Instruments Played", "instrumentsPlayed")}
          {renderInputField("Animals Owned", "animalsOwned")}
          {renderInputField("Holiday Cities", "holidayCities")}
          {renderInputField("New Year's Eve Cities", "newYearCities")}
        </FormSection>

        <FormSection title="Relatives and Friends">
          {renderInputField("Mother's First Name", "motherFirstName")}
          {renderInputField("Mother's Last Name", "motherLastName")}
          {renderInputField("Father's First Name", "fatherFirstName")}
          {renderInputField("Grandparent's Name", "grandparentName")}
          {renderInputField("Family Member Name", "familyMemberName")}
          {renderInputField("Last Partner's Name", "lastPartnerName")}
          {renderInputField("Close Friend's Name", "closeFriendName")}
        </FormSection>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onShowData}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          {showData ? 'Hide Data' : 'Show All Data'}
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          Clear Data
        </button>
      </div>

      {showData && (
        <KeystrokeDataDisplay 
          events={getLogs()}
          analytics={getAnalytics()}
          onExportJSON={exportAsJSON}
          onExportCSV={exportAsCSV}
        />
      )}
    </div>
  );
}
export {};
