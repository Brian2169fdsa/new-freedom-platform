import { useState, useMemo, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from '@reprieve/shared';
import { useAuth } from '@reprieve/shared/hooks/useAuth';
import {
  Search,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkCheck,
  Home,
  Heart,
  Sparkles,
  Filter,
  Users,
  Phone,
  ExternalLink,
  Wifi,
  Car,
  UtensilsCrossed,
  ShieldCheck,
  Dog,
  Accessibility,
  Baby,
  X,
  ImageOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HousingType = 'sober_living' | 'transitional' | 'affordable' | 'shelter' | 'section_8';

type AvailabilityStatus = 'available' | 'waitlist' | 'full';

type Amenity =
  | 'wifi'
  | 'parking'
  | 'meals'
  | 'security'
  | 'pet_friendly'
  | 'accessible'
  | 'family_friendly'
  | 'case_management'
  | 'job_training'
  | 'drug_testing';

type DistanceRadius = 5 | 10 | 25 | 50;

type ViewTab = 'search' | 'saved';

interface HousingListing {
  readonly id: string;
  readonly name: string;
  readonly type: HousingType;
  readonly address: string;
  readonly city: string;
  readonly priceMin: number;
  readonly priceMax: number;
  readonly pricePeriod: 'month' | 'week' | 'night';
  readonly availability: AvailabilityStatus;
  readonly distance: number;
  readonly amenities: readonly Amenity[];
  readonly description: string;
  readonly rules: readonly string[];
  readonly requirements: readonly string[];
  readonly contactPhone: string;
  readonly contactEmail: string;
  readonly applicationUrl: string;
  readonly acceptsVouchers: boolean;
  readonly capacity: number;
  readonly currentOccupancy: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOUSING_TYPE_LABELS: Record<HousingType, string> = {
  sober_living: 'Sober Living',
  transitional: 'Transitional',
  affordable: 'Affordable Housing',
  shelter: 'Shelter',
  section_8: 'Section 8',
};

const HOUSING_TYPE_FILTERS: readonly { readonly value: HousingType; readonly label: string }[] = [
  { value: 'sober_living', label: 'Sober Living' },
  { value: 'transitional', label: 'Transitional' },
  { value: 'affordable', label: 'Affordable Housing' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'section_8', label: 'Section 8' },
] as const;

const DISTANCE_OPTIONS: readonly DistanceRadius[] = [5, 10, 25, 50] as const;

const TYPE_BADGE_STYLES: Record<HousingType, string> = {
  sober_living: 'bg-green-100 text-green-800',
  transitional: 'bg-blue-100 text-blue-800',
  affordable: 'bg-purple-100 text-purple-800',
  shelter: 'bg-blue-100 text-blue-800',
  section_8: 'bg-teal-100 text-teal-800',
};

const AVAILABILITY_CONFIG: Record<AvailabilityStatus, { label: string; style: string; icon: typeof CheckCircle2 }> = {
  available: { label: 'Available', style: 'text-green-700 bg-green-50', icon: CheckCircle2 },
  waitlist: { label: 'Waitlist', style: 'text-blue-700 bg-blue-50', icon: AlertCircle },
  full: { label: 'Full', style: 'text-red-700 bg-red-50', icon: XCircle },
};

const AMENITY_CONFIG: Record<Amenity, { label: string; icon: typeof Wifi }> = {
  wifi: { label: 'Wi-Fi', icon: Wifi },
  parking: { label: 'Parking', icon: Car },
  meals: { label: 'Meals', icon: UtensilsCrossed },
  security: { label: '24/7 Security', icon: ShieldCheck },
  pet_friendly: { label: 'Pet Friendly', icon: Dog },
  accessible: { label: 'Accessible', icon: Accessibility },
  family_friendly: { label: 'Family Friendly', icon: Baby },
  case_management: { label: 'Case Mgmt', icon: Users },
  job_training: { label: 'Job Training', icon: ShieldCheck },
  drug_testing: { label: 'Drug Testing', icon: ShieldCheck },
};

// ---------------------------------------------------------------------------
// Mock Data — 18 Phoenix-area housing listings
// ---------------------------------------------------------------------------

const MOCK_LISTINGS: readonly HousingListing[] = [
  {
    id: 'hsg-001',
    name: 'Phoenix Rise Sober Living',
    type: 'sober_living',
    address: '2415 N 24th St',
    city: 'Phoenix, AZ 85008',
    priceMin: 550,
    priceMax: 750,
    pricePeriod: 'month',
    availability: 'available',
    distance: 3.2,
    amenities: ['wifi', 'parking', 'drug_testing', 'case_management'],
    description:
      'A structured sober living home in central Phoenix offering a supportive recovery environment. We provide weekly house meetings, peer accountability, and connections to local recovery resources. Residents are expected to maintain sobriety, attend meetings, and contribute to household chores.',
    rules: ['Zero-tolerance substance policy', 'Curfew 10 PM weeknights, 12 AM weekends', 'Weekly drug testing', 'Must attend 3 meetings per week', 'Guest hours 10 AM - 8 PM'],
    requirements: ['30 days clean and sober', 'Valid ID', 'Proof of income or active job search', 'Background check (fair chance)'],
    contactPhone: '(602) 555-0101',
    contactEmail: 'intake@phoenixrise.example.com',
    applicationUrl: 'https://example.com/apply/phoenix-rise',
    acceptsVouchers: false,
    capacity: 12,
    currentOccupancy: 9,
  },
  {
    id: 'hsg-002',
    name: 'New Beginnings Transitional Housing',
    type: 'transitional',
    address: '1830 W McDowell Rd',
    city: 'Phoenix, AZ 85007',
    priceMin: 0,
    priceMax: 400,
    pricePeriod: 'month',
    availability: 'waitlist',
    distance: 5.1,
    amenities: ['meals', 'case_management', 'job_training', 'accessible'],
    description:
      'Transitional housing program for individuals re-entering the community after incarceration. We offer up to 24 months of housing, case management, employment assistance, and life skills training. Sliding-scale rent based on income. Partnered with Maricopa County Re-Entry services.',
    rules: ['Participate in case management plan', 'Maintain employment or active job search', 'No alcohol or drugs on premises', 'Attend weekly life skills workshop', 'Comply with house responsibilities'],
    requirements: ['Recently released from incarceration (within 12 months)', 'Willingness to follow program rules', 'Active participation in re-entry plan'],
    contactPhone: '(602) 555-0202',
    contactEmail: 'apply@newbeginnings.example.com',
    applicationUrl: 'https://example.com/apply/new-beginnings',
    acceptsVouchers: true,
    capacity: 40,
    currentOccupancy: 40,
  },
  {
    id: 'hsg-003',
    name: 'Desert Haven Apartments',
    type: 'affordable',
    address: '4520 E Thomas Rd',
    city: 'Phoenix, AZ 85018',
    priceMin: 650,
    priceMax: 950,
    pricePeriod: 'month',
    availability: 'available',
    distance: 7.3,
    amenities: ['wifi', 'parking', 'accessible', 'family_friendly'],
    description:
      'Affordable apartment complex with income-restricted units for individuals and families. Located near public transit, shopping, and employment centers. On-site laundry facilities, community room, and playground. No criminal background disqualification — fair chance screening.',
    rules: ['Standard lease agreement', 'No smoking in units', 'Quiet hours 10 PM - 7 AM', 'Pet deposit required for animals'],
    requirements: ['Income at or below 60% AMI', 'Pass credit check (flexible standards)', 'First month rent + $300 deposit', 'Valid ID and proof of income'],
    contactPhone: '(602) 555-0303',
    contactEmail: 'leasing@deserthaven.example.com',
    applicationUrl: 'https://example.com/apply/desert-haven',
    acceptsVouchers: true,
    capacity: 80,
    currentOccupancy: 73,
  },
  {
    id: 'hsg-004',
    name: 'CASS Emergency Shelter',
    type: 'shelter',
    address: '230 S 12th Ave',
    city: 'Phoenix, AZ 85007',
    priceMin: 0,
    priceMax: 0,
    pricePeriod: 'night',
    availability: 'available',
    distance: 4.8,
    amenities: ['meals', 'security', 'case_management', 'accessible'],
    description:
      'Central Arizona Shelter Services provides emergency overnight shelter, meals, and access to case managers who can help connect you with longer-term housing, employment, and benefits. Walk-in intake available daily.',
    rules: ['Check in by 5 PM daily', 'No weapons or contraband', 'Respectful behavior toward staff and residents', 'Sobriety required on premises'],
    requirements: ['Photo ID preferred but not required', 'TB screening (available on-site)'],
    contactPhone: '(602) 555-0404',
    contactEmail: 'info@cass-shelter.example.com',
    applicationUrl: 'https://example.com/apply/cass',
    acceptsVouchers: false,
    capacity: 500,
    currentOccupancy: 420,
  },
  {
    id: 'hsg-005',
    name: 'Maryvale Section 8 Homes',
    type: 'section_8',
    address: '5135 W Indian School Rd',
    city: 'Phoenix, AZ 85031',
    priceMin: 200,
    priceMax: 500,
    pricePeriod: 'month',
    availability: 'waitlist',
    distance: 12.4,
    amenities: ['parking', 'family_friendly', 'pet_friendly'],
    description:
      'Single-family homes and duplexes accepting Housing Choice Vouchers (Section 8). Quiet residential neighborhood in Maryvale with yards, close to schools and parks. Landlord partners with housing authority for streamlined move-in.',
    rules: ['Standard Section 8 lease terms', 'Maintain property and yard', 'Annual income recertification', 'Background check with fair chance consideration'],
    requirements: ['Active Housing Choice Voucher', 'Income verification', 'Voucher briefing completed', 'Deposit (up to 1 month rent portion)'],
    contactPhone: '(602) 555-0505',
    contactEmail: 'section8@maryvale-homes.example.com',
    applicationUrl: 'https://example.com/apply/maryvale-s8',
    acceptsVouchers: true,
    capacity: 25,
    currentOccupancy: 23,
  },
  {
    id: 'hsg-006',
    name: 'Second Chance Sober Home — Men',
    type: 'sober_living',
    address: '3602 N 16th St',
    city: 'Phoenix, AZ 85016',
    priceMin: 500,
    priceMax: 650,
    pricePeriod: 'month',
    availability: 'available',
    distance: 4.1,
    amenities: ['wifi', 'parking', 'drug_testing', 'job_training'],
    description:
      'Men-only sober living home with structured programming. Residents participate in daily chores, job readiness workshops, and weekly accountability groups. Close to bus lines and shopping. Staff available 24/7. Many of our staff are in recovery themselves.',
    rules: ['Men only, 18+', 'Zero-tolerance substance policy', 'Must maintain employment after 30 days', 'Random drug testing', 'Curfew 11 PM'],
    requirements: ['14 days minimum sobriety', 'Willingness to work a recovery program', 'Government-issued ID', 'First week rent at move-in'],
    contactPhone: '(602) 555-0606',
    contactEmail: 'apply@secondchancesober.example.com',
    applicationUrl: 'https://example.com/apply/second-chance-men',
    acceptsVouchers: false,
    capacity: 8,
    currentOccupancy: 6,
  },
  {
    id: 'hsg-007',
    name: 'Tempe Bridge Transitional Program',
    type: 'transitional',
    address: '1250 E Apache Blvd',
    city: 'Tempe, AZ 85281',
    priceMin: 100,
    priceMax: 350,
    pricePeriod: 'month',
    availability: 'available',
    distance: 9.6,
    amenities: ['wifi', 'meals', 'case_management', 'job_training', 'accessible'],
    description:
      'Bridge housing program in partnership with Tempe Community Action Agency. Designed for individuals transitioning out of homelessness or incarceration. Up to 18 months of supportive housing with on-site case managers, group counseling, and employment services.',
    rules: ['Active participation in individualized service plan', 'Maintain sobriety', 'Contribute to community living (cooking rotation, cleaning)', 'Save 30% of income in escrow account'],
    requirements: ['Referral from community agency or self-referral accepted', 'Income below 30% AMI', 'Commitment to housing stability plan'],
    contactPhone: '(480) 555-0707',
    contactEmail: 'housing@tempebridge.example.com',
    applicationUrl: 'https://example.com/apply/tempe-bridge',
    acceptsVouchers: true,
    capacity: 30,
    currentOccupancy: 24,
  },
  {
    id: 'hsg-008',
    name: 'Mesa Oasis Family Shelter',
    type: 'shelter',
    address: '616 S Country Club Dr',
    city: 'Mesa, AZ 85210',
    priceMin: 0,
    priceMax: 0,
    pricePeriod: 'night',
    availability: 'available',
    distance: 15.2,
    amenities: ['meals', 'security', 'family_friendly', 'case_management', 'accessible'],
    description:
      'Family-focused emergency shelter providing safe beds, meals, and wraparound services for families experiencing homelessness. Children\'s programs, parenting classes, and rapid re-housing assistance available. Private family rooms ensure dignity and safety.',
    rules: ['Families with children prioritized', 'Check-in by 6 PM', 'Attend weekly case management meeting', 'No drugs, alcohol, or weapons'],
    requirements: ['At least one child under 18', 'Photo ID for adults (assistance available if needed)', 'Complete intake assessment'],
    contactPhone: '(480) 555-0808',
    contactEmail: 'families@mesaoasis.example.com',
    applicationUrl: 'https://example.com/apply/mesa-oasis',
    acceptsVouchers: false,
    capacity: 60,
    currentOccupancy: 48,
  },
  {
    id: 'hsg-009',
    name: 'Grace House — Women\'s Sober Living',
    type: 'sober_living',
    address: '4220 N 20th St',
    city: 'Phoenix, AZ 85016',
    priceMin: 525,
    priceMax: 700,
    pricePeriod: 'month',
    availability: 'waitlist',
    distance: 5.5,
    amenities: ['wifi', 'parking', 'drug_testing', 'case_management'],
    description:
      'Women-only sober living home in a quiet Phoenix neighborhood. Supportive, nurturing environment with trauma-informed care. Weekly women\'s recovery meetings on-site. Partnerships with local employers for job placement. Children may be accommodated in some rooms.',
    rules: ['Women only, 18+', 'Zero-tolerance substance policy', 'Attend minimum 4 recovery meetings per week', 'Random drug testing', 'Participate in house meetings'],
    requirements: ['Minimum 7 days sober', 'Government-issued ID', 'Commitment to recovery program', 'First two weeks rent at move-in'],
    contactPhone: '(602) 555-0909',
    contactEmail: 'apply@gracehouse.example.com',
    applicationUrl: 'https://example.com/apply/grace-house',
    acceptsVouchers: false,
    capacity: 10,
    currentOccupancy: 10,
  },
  {
    id: 'hsg-010',
    name: 'Chandler Crossing Affordable Living',
    type: 'affordable',
    address: '777 W Chandler Blvd',
    city: 'Chandler, AZ 85225',
    priceMin: 700,
    priceMax: 1100,
    pricePeriod: 'month',
    availability: 'available',
    distance: 18.3,
    amenities: ['wifi', 'parking', 'accessible', 'family_friendly', 'pet_friendly'],
    description:
      'LIHTC (Low-Income Housing Tax Credit) apartment community in Chandler. 1, 2, and 3-bedroom units available. Community pool, fitness center, and business center. Convenient to Chandler Fashion Center and employers along the Price Road corridor.',
    rules: ['Income qualification required', 'Standard 12-month lease', 'Pet policy: 2 pets max, breed restrictions apply', 'No smoking in units or common areas'],
    requirements: ['Income at or below 50% AMI', 'Rental history (3 years, flexible for gaps)', 'Security deposit equal to one month rent', 'Background check with fair chance review'],
    contactPhone: '(480) 555-1010',
    contactEmail: 'leasing@chandlercrossing.example.com',
    applicationUrl: 'https://example.com/apply/chandler-crossing',
    acceptsVouchers: true,
    capacity: 120,
    currentOccupancy: 108,
  },
  {
    id: 'hsg-011',
    name: 'St. Vincent de Paul Overflow Shelter',
    type: 'shelter',
    address: '1075 W Jackson St',
    city: 'Phoenix, AZ 85007',
    priceMin: 0,
    priceMax: 0,
    pricePeriod: 'night',
    availability: 'available',
    distance: 4.2,
    amenities: ['meals', 'security', 'accessible'],
    description:
      'Walk-in overflow shelter providing emergency beds, hot meals, and resource navigation. Open seasonally and during extreme heat or cold events. Day-use resource center with showers, laundry, phone charging, and mail services. No prerequisites for entry.',
    rules: ['No weapons', 'Respectful behavior required', 'Quiet hours after 9 PM', 'Must vacate by 7 AM for day-use program'],
    requirements: ['No ID required', 'Walk-in basis, first come first served'],
    contactPhone: '(602) 555-1111',
    contactEmail: 'shelter@svdp-phoenix.example.com',
    applicationUrl: 'https://example.com/apply/svdp-overflow',
    acceptsVouchers: false,
    capacity: 200,
    currentOccupancy: 155,
  },
  {
    id: 'hsg-012',
    name: 'Scottsdale Section 8 Townhomes',
    type: 'section_8',
    address: '8120 E Indian Bend Rd',
    city: 'Scottsdale, AZ 85250',
    priceMin: 250,
    priceMax: 600,
    pricePeriod: 'month',
    availability: 'full',
    distance: 14.7,
    amenities: ['parking', 'family_friendly', 'accessible'],
    description:
      'Townhome community in south Scottsdale accepting Housing Choice Vouchers. 2 and 3-bedroom units with attached garages. Walking distance to public transit and shopping. Professional property management ensures well-maintained community.',
    rules: ['Section 8 program compliance required', 'Maintain unit and surrounding area', 'No unauthorized occupants', 'Report income changes within 30 days'],
    requirements: ['Active Housing Choice Voucher from housing authority', 'Income verification and background check', 'Good standing with previous landlords', 'Security deposit negotiable'],
    contactPhone: '(480) 555-1212',
    contactEmail: 'voucher@scottsdale-townhomes.example.com',
    applicationUrl: 'https://example.com/apply/scottsdale-s8',
    acceptsVouchers: true,
    capacity: 35,
    currentOccupancy: 35,
  },
  {
    id: 'hsg-013',
    name: 'Restore Recovery Residence',
    type: 'sober_living',
    address: '1918 E Camelback Rd',
    city: 'Phoenix, AZ 85016',
    priceMin: 600,
    priceMax: 800,
    pricePeriod: 'month',
    availability: 'available',
    distance: 6.0,
    amenities: ['wifi', 'parking', 'drug_testing', 'case_management', 'job_training'],
    description:
      'AZDHS-licensed recovery residence offering structured programming for men and women in early recovery. Clinical support available on-site. MAT-friendly. Insurance may cover partial costs. Residents benefit from IOP groups, life skills education, and vocational assistance.',
    rules: ['Follow individualized recovery plan', 'Zero-tolerance substance policy', 'Attend all scheduled programming', 'Maintain household responsibilities', 'Visitors by appointment only'],
    requirements: ['Commitment to recovery', 'Insurance or ability to self-pay', 'Medical clearance', 'Intake assessment and interview'],
    contactPhone: '(602) 555-1313',
    contactEmail: 'admissions@restorerecovery.example.com',
    applicationUrl: 'https://example.com/apply/restore-recovery',
    acceptsVouchers: false,
    capacity: 16,
    currentOccupancy: 11,
  },
  {
    id: 'hsg-014',
    name: 'Glendale Gateway Apartments',
    type: 'affordable',
    address: '6025 W Glendale Ave',
    city: 'Glendale, AZ 85301',
    priceMin: 600,
    priceMax: 900,
    pricePeriod: 'month',
    availability: 'available',
    distance: 11.8,
    amenities: ['wifi', 'parking', 'family_friendly', 'pet_friendly', 'accessible'],
    description:
      'Affordable housing community in west Glendale near entertainment district. Studios, 1-bedroom, and 2-bedroom units available. Managed by a nonprofit with on-site resident services including financial coaching, after-school tutoring, and community events.',
    rules: ['Income qualification required annually', '12-month lease minimum', 'No smoking on property', 'Pets require $250 deposit and veterinary records'],
    requirements: ['Income at or below 60% AMI', 'Complete application and screening', 'First and last month rent', 'Government ID and income documentation'],
    contactPhone: '(623) 555-1414',
    contactEmail: 'apply@glendalegateway.example.com',
    applicationUrl: 'https://example.com/apply/glendale-gateway',
    acceptsVouchers: true,
    capacity: 95,
    currentOccupancy: 82,
  },
  {
    id: 'hsg-015',
    name: 'Hope Springs Transitional Shelter',
    type: 'transitional',
    address: '3340 W Durango St',
    city: 'Phoenix, AZ 85009',
    priceMin: 0,
    priceMax: 250,
    pricePeriod: 'month',
    availability: 'available',
    distance: 6.7,
    amenities: ['meals', 'case_management', 'job_training', 'security'],
    description:
      'Transitional shelter specifically designed for men and women leaving incarceration. Up to 12 months of housing. Intensive case management, anger management classes, substance abuse counseling referrals, and job placement services. Graduated program with increasing independence.',
    rules: ['Follow graduated program structure', 'No substance use', 'Mandatory case management meetings', 'Community service hours required', 'Save 25% of earnings'],
    requirements: ['Released within past 6 months', 'Referral from corrections, parole, or community agency', 'Willingness to participate in all programming'],
    contactPhone: '(602) 555-1515',
    contactEmail: 'referrals@hopesprings.example.com',
    applicationUrl: 'https://example.com/apply/hope-springs',
    acceptsVouchers: false,
    capacity: 50,
    currentOccupancy: 38,
  },
  {
    id: 'hsg-016',
    name: 'Sunrise Sober Living — East Valley',
    type: 'sober_living',
    address: '2840 E Southern Ave',
    city: 'Mesa, AZ 85204',
    priceMin: 475,
    priceMax: 625,
    pricePeriod: 'month',
    availability: 'available',
    distance: 16.1,
    amenities: ['wifi', 'parking', 'drug_testing'],
    description:
      'Affordable sober living in the East Valley. Quiet neighborhood, close to transit and light rail. Shared rooms to keep costs low. House manager on-site. Weekly BBQs and group outings build community and accountability. We welcome those starting over.',
    rules: ['Sobriety is mandatory', 'Weekly drug screens', 'House chores on rotation', 'Curfew 10 PM Sunday-Thursday', 'No overnight guests'],
    requirements: ['Desire to live sober', 'Government-issued ID', 'Able to pay weekly ($120/week)', 'Interview with house manager'],
    contactPhone: '(480) 555-1616',
    contactEmail: 'info@sunrisesober.example.com',
    applicationUrl: 'https://example.com/apply/sunrise-east-valley',
    acceptsVouchers: false,
    capacity: 12,
    currentOccupancy: 8,
  },
  {
    id: 'hsg-017',
    name: 'AZ Housing Authority — Westside',
    type: 'section_8',
    address: '3838 N 35th Ave',
    city: 'Phoenix, AZ 85017',
    priceMin: 150,
    priceMax: 450,
    pricePeriod: 'month',
    availability: 'waitlist',
    distance: 8.3,
    amenities: ['parking', 'accessible', 'family_friendly'],
    description:
      'Project-based Section 8 housing managed by the Arizona Housing Authority. Mix of 1 to 4-bedroom units in a gated community. On-site management office, community garden, and playground. Priority given to veterans, persons with disabilities, and families.',
    rules: ['Comply with housing authority lease', 'Report income changes promptly', 'Maintain unit cleanliness', 'No unauthorized modifications to unit'],
    requirements: ['Complete HCV application through housing authority', 'Meet HUD income guidelines', 'Pass background screening (case-by-case review)', 'Provide required documentation'],
    contactPhone: '(602) 555-1717',
    contactEmail: 'applications@azhousing.example.com',
    applicationUrl: 'https://example.com/apply/az-housing-westside',
    acceptsVouchers: true,
    capacity: 70,
    currentOccupancy: 66,
  },
  {
    id: 'hsg-018',
    name: 'Phoenix Rescue Mission — Men\'s Center',
    type: 'shelter',
    address: '1801 S 35th Ave',
    city: 'Phoenix, AZ 85009',
    priceMin: 0,
    priceMax: 0,
    pricePeriod: 'night',
    availability: 'available',
    distance: 7.9,
    amenities: ['meals', 'security', 'case_management', 'job_training'],
    description:
      'Emergency and transitional shelter for men. Hot meals served three times daily. Clothing and hygiene supplies provided. On-site chapel services, addiction recovery program, and job readiness workshops. Long-term program available for men committed to transformation.',
    rules: ['Men only, 18+', 'No drugs, alcohol, or weapons', 'Attend chapel service or alternative programming', 'Participate in assigned chores', 'Respectful conduct at all times'],
    requirements: ['Walk-in welcome', 'No ID required for emergency bed', 'TB test required for long-term program (available on-site)'],
    contactPhone: '(602) 555-1818',
    contactEmail: 'info@phoenixrescue.example.com',
    applicationUrl: 'https://example.com/apply/phoenix-rescue-men',
    acceptsVouchers: false,
    capacity: 250,
    currentOccupancy: 195,
  },
];

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function formatPrice(listing: HousingListing): string {
  if (listing.priceMin === 0 && listing.priceMax === 0) {
    return 'Free';
  }
  const period = listing.pricePeriod === 'month' ? '/mo' : listing.pricePeriod === 'week' ? '/wk' : '/night';
  if (listing.priceMin === listing.priceMax) {
    return `$${listing.priceMin}${period}`;
  }
  if (listing.priceMin === 0) {
    return `Up to $${listing.priceMax}${period}`;
  }
  return `$${listing.priceMin} - $${listing.priceMax}${period}`;
}

function formatDistance(miles: number): string {
  return `${miles.toFixed(1)} mi`;
}

function getOccupancyPercentage(listing: HousingListing): number {
  if (listing.capacity === 0) return 0;
  return Math.round((listing.currentOccupancy / listing.capacity) * 100);
}

// ---------------------------------------------------------------------------
// Filter Bar Component
// ---------------------------------------------------------------------------

interface FilterBarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly selectedTypes: ReadonlySet<HousingType>;
  readonly onTypeToggle: (type: HousingType) => void;
  readonly priceMin: string;
  readonly priceMax: string;
  readonly onPriceMinChange: (value: string) => void;
  readonly onPriceMaxChange: (value: string) => void;
  readonly distanceRadius: DistanceRadius;
  readonly onDistanceChange: (radius: DistanceRadius) => void;
}

function FilterBar({
  searchQuery,
  onSearchChange,
  selectedTypes,
  onTypeToggle,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  distanceRadius,
  onDistanceChange,
}: FilterBarProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, address, or keyword..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Toggle filters on mobile */}
          <button
            onClick={() => setFiltersExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors sm:hidden"
          >
            <Filter className="h-4 w-4" />
            {filtersExpanded ? 'Hide Filters' : 'Show Filters'}
            {filtersExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {/* Filter Controls */}
          <div className={`space-y-3 ${filtersExpanded ? 'block' : 'hidden'} sm:block`}>
            {/* Housing Type Filter Pills */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Housing Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {HOUSING_TYPE_FILTERS.map((typeFilter) => (
                  <button
                    key={typeFilter.value}
                    onClick={() => onTypeToggle(typeFilter.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      selectedTypes.has(typeFilter.value)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {typeFilter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range + Distance */}
            <div className="flex flex-wrap items-end gap-4">
              {/* Price Range */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Price Range ($/month)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => onPriceMinChange(e.target.value)}
                    className="w-24 h-8 text-xs"
                    min={0}
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => onPriceMaxChange(e.target.value)}
                    className="w-24 h-8 text-xs"
                    min={0}
                  />
                </div>
              </div>

              {/* Distance Radius */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Distance
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DISTANCE_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => onDistanceChange(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        distanceRadius === d
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {d} mi
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Amenity Icon Component
// ---------------------------------------------------------------------------

interface AmenityIconProps {
  readonly amenity: Amenity;
  readonly size?: 'sm' | 'md';
}

function AmenityIcon({ amenity, size = 'sm' }: AmenityIconProps) {
  const config = AMENITY_CONFIG[amenity];
  const IconComponent = config.icon;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <span
      className="inline-flex items-center gap-1 text-slate-500"
      title={config.label}
    >
      <IconComponent className={iconSize} />
      {size === 'md' && <span className="text-xs">{config.label}</span>}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Housing Card Component
// ---------------------------------------------------------------------------

interface HousingCardProps {
  readonly listing: HousingListing;
  readonly isSaved: boolean;
  readonly onToggleSave: (listingId: string) => void;
  readonly onOpenDetail: (listingId: string) => void;
}

function HousingCard({ listing, isSaved, onToggleSave, onOpenDetail }: HousingCardProps) {
  const availConfig = AVAILABILITY_CONFIG[listing.availability];
  const AvailIcon = availConfig.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 text-base leading-tight">
                {listing.name}
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">
                {listing.address}, {listing.city}
              </p>
            </div>
            <button
              onClick={() => onToggleSave(listing.id)}
              className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                isSaved
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  : 'text-slate-300 hover:text-blue-500 hover:bg-slate-50'
              }`}
              aria-label={isSaved ? 'Remove from saved listings' : 'Save listing'}
            >
              {isSaved ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {formatPrice(listing)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {formatDistance(listing.distance)}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${availConfig.style}`}>
              <AvailIcon className="h-3 w-3" />
              {availConfig.label}
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE_STYLES[listing.type]}`}
            >
              {HOUSING_TYPE_LABELS[listing.type]}
            </span>
            {listing.acceptsVouchers && (
              <Badge variant="success">Accepts Vouchers</Badge>
            )}
          </div>

          {/* Amenity Icons */}
          {listing.amenities.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {listing.amenities.map((amenity) => (
                <AmenityIcon key={amenity} amenity={amenity} />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDetail(listing.id)}
              className="flex-shrink-0"
            >
              View Details
            </Button>
            {listing.availability !== 'full' && (
              <Button
                size="sm"
                onClick={() => window.open(listing.applicationUrl, '_blank', 'noopener,noreferrer')}
                className="flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Apply
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Housing Detail Modal Component
// ---------------------------------------------------------------------------

interface HousingDetailModalProps {
  readonly listing: HousingListing | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly isSaved: boolean;
  readonly onToggleSave: (listingId: string) => void;
}

function HousingDetailModal({ listing, open, onOpenChange, isSaved, onToggleSave }: HousingDetailModalProps) {
  if (!listing) return null;

  const availConfig = AVAILABILITY_CONFIG[listing.availability];
  const AvailIcon = availConfig.icon;
  const occupancyPercent = getOccupancyPercentage(listing);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{listing.name}</DialogTitle>
        <p className="text-sm text-slate-500 mt-1">
          {listing.address}, {listing.city}
        </p>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-5">
          {/* Photo placeholder */}
          <div className="bg-slate-100 rounded-lg h-40 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <ImageOff className="h-8 w-8 mx-auto mb-2" />
              <p className="text-xs">Photos coming soon</p>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <DollarSign className="h-4 w-4 mx-auto text-slate-400 mb-1" />
              <p className="text-sm font-semibold text-slate-800">{formatPrice(listing)}</p>
              <p className="text-[11px] text-slate-500">Price</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <MapPin className="h-4 w-4 mx-auto text-slate-400 mb-1" />
              <p className="text-sm font-semibold text-slate-800">{formatDistance(listing.distance)}</p>
              <p className="text-[11px] text-slate-500">Distance</p>
            </div>
          </div>

          {/* Availability & Occupancy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${availConfig.style}`}>
                <AvailIcon className="h-3 w-3" />
                {availConfig.label}
              </span>
              <span className="text-xs text-slate-500">
                {listing.currentOccupancy}/{listing.capacity} occupied ({occupancyPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  occupancyPercent >= 90 ? 'bg-red-500' : occupancyPercent >= 70 ? 'bg-blue-500' : 'bg-green-500'
                }`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>

          {/* Type & Vouchers */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE_STYLES[listing.type]}`}>
              {HOUSING_TYPE_LABELS[listing.type]}
            </span>
            {listing.acceptsVouchers && (
              <Badge variant="success">Accepts Vouchers</Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-1.5">About</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{listing.description}</p>
          </div>

          {/* Amenities */}
          {listing.amenities.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-1.5">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600"
                  >
                    <AmenityIcon amenity={amenity} />
                    {AMENITY_CONFIG[amenity].label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {listing.rules.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-1.5">House Rules</h4>
              <ul className="space-y-1.5">
                {listing.rules.map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {listing.requirements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-1.5">Requirements</h4>
              <ul className="space-y-1.5">
                {listing.requirements.map((req) => (
                  <li key={req} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Contact Information</h4>
            <div className="space-y-1.5 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {listing.contactPhone}
              </p>
              <p className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                {listing.contactEmail}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleSave(listing.id)}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="h-4 w-4 mr-1" />
              Saved
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-1" />
              Save
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`tel:${listing.contactPhone.replace(/[^0-9+]/g, '')}`, '_self')}
        >
          <Phone className="h-4 w-4 mr-1" />
          Call
        </Button>
        {listing.availability !== 'full' && (
          <Button
            size="sm"
            onClick={() => window.open(listing.applicationUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Apply Now
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// View Tabs Component
// ---------------------------------------------------------------------------

interface ViewTabsProps {
  readonly activeTab: ViewTab;
  readonly onTabChange: (tab: ViewTab) => void;
  readonly savedCount: number;
  readonly totalCount: number;
}

function ViewTabs({ activeTab, onTabChange, savedCount, totalCount }: ViewTabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100">
      <button
        onClick={() => onTabChange('search')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'search'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Search className="h-4 w-4" />
        Search
        <span className="text-xs text-slate-400">({totalCount})</span>
      </button>
      <button
        onClick={() => onTabChange('saved')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'saved'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Heart className="h-4 w-4" />
        Saved
        {savedCount > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-blue-100 text-blue-800 text-xs font-medium px-1.5">
            {savedCount}
          </span>
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State Component
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  readonly variant: 'no-results' | 'no-saved';
}

function EmptyState({ variant }: EmptyStateProps) {
  if (variant === 'no-saved') {
    return (
      <Card className="border-dashed border-slate-300">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center">
            <Bookmark className="h-7 w-7 text-blue-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No saved listings yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Tap the bookmark icon on any housing listing to save it here for easy access later.
            Having options is the first step toward finding your next home.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-slate-300">
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center">
          <Search className="h-7 w-7 text-blue-400" />
        </div>
        <h3 className="font-semibold text-slate-700 mb-1">No listings match your filters</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Try adjusting your search, filters, or distance radius.
          New housing options are added regularly. Keep looking — your next home is out there.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function Housing() {
  // Auth
  useAuth();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ReadonlySet<HousingType>>(new Set());
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [distanceRadius, setDistanceRadius] = useState<DistanceRadius>(25);

  // View state
  const [activeTab, setActiveTab] = useState<ViewTab>('search');
  const [savedListingIds, setSavedListingIds] = useState<ReadonlySet<string>>(new Set());
  const [detailListingId, setDetailListingId] = useState<string | null>(null);

  // Handlers — all produce new state, never mutate
  const handleTypeToggle = useCallback((type: HousingType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleToggleSave = useCallback((listingId: string) => {
    setSavedListingIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });
  }, []);

  const handleOpenDetail = useCallback((listingId: string) => {
    setDetailListingId(listingId);
  }, []);

  const handleCloseDetail = useCallback((open: boolean) => {
    if (!open) {
      setDetailListingId(null);
    }
  }, []);

  // Filtered listings
  const filteredListings = useMemo(() => {
    const queryLower = searchQuery.toLowerCase().trim();
    const parsedMin = priceMin ? Number(priceMin) : null;
    const parsedMax = priceMax ? Number(priceMax) : null;

    return MOCK_LISTINGS.filter((listing) => {
      // Text search
      if (queryLower) {
        const searchable = `${listing.name} ${listing.address} ${listing.city} ${listing.description} ${HOUSING_TYPE_LABELS[listing.type]}`.toLowerCase();
        if (!searchable.includes(queryLower)) {
          return false;
        }
      }

      // Type filter — if any types selected, listing must match one
      if (selectedTypes.size > 0 && !selectedTypes.has(listing.type)) {
        return false;
      }

      // Price filter
      if (parsedMin !== null && !isNaN(parsedMin) && listing.priceMax < parsedMin) {
        return false;
      }
      if (parsedMax !== null && !isNaN(parsedMax) && listing.priceMin > parsedMax) {
        return false;
      }

      // Distance filter
      if (listing.distance > distanceRadius) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedTypes, priceMin, priceMax, distanceRadius]);

  // Listings for current view
  const displayedListings = useMemo(() => {
    if (activeTab === 'saved') {
      return filteredListings.filter((listing) => savedListingIds.has(listing.id));
    }
    return filteredListings;
  }, [activeTab, filteredListings, savedListingIds]);

  const savedCount = MOCK_LISTINGS.filter((listing) => savedListingIds.has(listing.id)).length;

  // Detail modal listing
  const detailListing = useMemo(() => {
    if (!detailListingId) return null;
    return MOCK_LISTINGS.find((l) => l.id === detailListingId) ?? null;
  }, [detailListingId]);

  return (
    <PageContainer title="Housing Search" subtitle="Find safe, affordable housing in the Phoenix area">
      {/* Back link */}
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 -mt-2 mb-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Tools
      </Link>

      {/* Encouraging banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-blue-700 text-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">A safe place to call home</h3>
              <p className="text-blue-100 text-sm mt-0.5">
                Stable housing is the foundation for everything else. Browse sober living homes,
                shelters, transitional programs, and affordable apartments across the Phoenix metro area.
                Many of these organizations specifically serve people rebuilding their lives.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filters */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTypes={selectedTypes}
        onTypeToggle={handleTypeToggle}
        priceMin={priceMin}
        priceMax={priceMax}
        onPriceMinChange={setPriceMin}
        onPriceMaxChange={setPriceMax}
        distanceRadius={distanceRadius}
        onDistanceChange={setDistanceRadius}
      />

      {/* View Tabs */}
      <ViewTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedCount={savedCount}
        totalCount={filteredListings.length}
      />

      {/* Results Count */}
      {displayedListings.length > 0 && (
        <p className="text-sm text-slate-500">
          Showing {displayedListings.length}{' '}
          {displayedListings.length === 1 ? 'listing' : 'listings'}
          {activeTab === 'saved' ? ' you saved' : ''}
        </p>
      )}

      {/* Listing Grid */}
      {displayedListings.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {displayedListings.map((listing) => (
            <HousingCard
              key={listing.id}
              listing={listing}
              isSaved={savedListingIds.has(listing.id)}
              onToggleSave={handleToggleSave}
              onOpenDetail={handleOpenDetail}
            />
          ))}
        </div>
      ) : (
        <EmptyState variant={activeTab === 'saved' ? 'no-saved' : 'no-results'} />
      )}

      {/* Detail Modal */}
      <HousingDetailModal
        listing={detailListing}
        open={detailListingId !== null}
        onOpenChange={handleCloseDetail}
        isSaved={detailListingId !== null && savedListingIds.has(detailListingId)}
        onToggleSave={handleToggleSave}
      />
    </PageContainer>
  );
}
