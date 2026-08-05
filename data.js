export const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'aggregates', label: 'Aggregates' },
  { id: 'rental', label: 'Rental' },
  { id: 'freight', label: 'Freight' },
  { id: 'projects', label: 'Projects' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'messages', label: 'Messages' },
  { id: 'supplier-portal', label: 'Portal' },
  { id: 'dashboard', label: 'Dashboard' }
];

export const CATEGORIES = {
  aggregates: {
    id: 'aggregates',
    name: 'Aggregates',
    icon: 'A',
    description: 'Stone, sand, gravel, and bulk material.',
    helper: 'Compare delivered pricing by ton and region.',
    fields: [
      { id: 'material', label: 'Material', type: 'select', options: ['3/4" Clear Stone', 'Granular A', 'Washed Sand', 'Rip Rap'] },
      { id: 'quantity', label: 'Quantity (tons)', type: 'number', placeholder: '250', min: 10, value: 250 },
      { id: 'location', label: 'Delivery city', type: 'text', placeholder: 'Mississauga, ON' }
    ]
  },
  rental: {
    id: 'rental',
    name: 'Rental',
    icon: 'R',
    description: 'Excavators, loaders, compactors, and attachments.',
    helper: 'Estimate daily rental cost and availability.',
    fields: [
      { id: 'equipment', label: 'Equipment', type: 'select', options: ['Mini Excavator', 'Skid Steer', 'Compactor', 'Loader'] },
      { id: 'days', label: 'Rental days', type: 'number', placeholder: '5', min: 1, value: 5 },
      { id: 'location', label: 'Pickup city', type: 'text', placeholder: 'Barrie, ON' }
    ]
  },
  freight: {
    id: 'freight',
    name: 'Freight',
    icon: 'F',
    description: 'Flatbed, lowboy, dump, and long-haul delivery.',
    helper: 'Estimate cost by distance and load size.',
    fields: [
      { id: 'load', label: 'Load type', type: 'select', options: ['General freight', 'Heavy equipment', 'Bulk material'] },
      { id: 'distance', label: 'Distance (km)', type: 'number', placeholder: '145', min: 10, value: 145 },
      { id: 'weight', label: 'Weight (tons)', type: 'number', placeholder: '18', min: 1, value: 18 }
    ]
  }
};

export const SUPPLIERS = [
  { id: 'S1', name: 'Dufferin Aggregates', city: 'Toronto, ON', country: 'CA', coords: [43.70, -79.42], categories: ['aggregates'], rating: 4.7, code: 'DA', website: 'dufferinaggregates.com', phone: '(416) 510-2000', tags: ['bulk loads', 'same-day quotes'] },
  { id: 'S2', name: 'Miller Group', city: 'Markham, ON', country: 'CA', coords: [43.86, -79.34], categories: ['aggregates', 'freight'], rating: 4.5, code: 'MG', website: 'millergroup.ca', phone: '(905) 475-6660', tags: ['logistics', 'recurring supply'] },
  { id: 'S3', name: 'Strada Aggregates', city: 'Vaughan, ON', country: 'CA', coords: [43.82, -79.50], categories: ['aggregates'], rating: 4.6, code: 'SA', website: 'stradagrp.com', phone: '(416) 747-1360', tags: ['contract pricing', 'granular'] },
  { id: 'S4', name: 'Battlefield Equipment', city: 'Barrie, ON', country: 'CA', coords: [44.39, -79.69], categories: ['rental'], rating: 4.8, code: 'BE', website: 'battlefieldequipment.ca', phone: '(800) 263-1455', tags: ['fleet coverage', 'fast pickup'] },
  { id: 'S5', name: 'NAM Rentals', city: 'London, ON', country: 'CA', coords: [42.98, -81.25], categories: ['rental', 'freight'], rating: 4.6, code: 'NR', website: 'namrentals.com', phone: '(519) 659-1135', tags: ['regional routes', 'attachments'] },
  { id: 'S6', name: 'CleanCo Services', city: 'Mississauga, ON', country: 'CA', coords: [43.59, -79.64], categories: ['freight'], rating: 4.5, code: 'CC', website: 'cleanco.ca', phone: '(905) 670-1100', tags: ['site logistics', 'dumpster moves'] },
  { id: 'S7', name: 'GreenFlow Irrigation', city: 'Guelph, ON', country: 'CA', coords: [43.55, -80.25], categories: ['freight'], rating: 4.4, code: 'GF', website: 'greenflow.ca', phone: '(519) 836-2200', tags: ['delivery support', 'site services'] },
  { id: 'S8', name: 'FuelExpress Ontario', city: 'Hamilton, ON', country: 'CA', coords: [43.26, -79.87], categories: ['freight'], rating: 4.3, code: 'FE', website: 'fuelexpress.ca', phone: '(905) 549-3300', tags: ['fuel logistics', 'service routes'] },
  { id: 'S9', name: 'NorthernFreight', city: 'Sudbury, ON', country: 'CA', coords: [46.49, -81.01], categories: ['freight'], rating: 4.2, code: 'NF', website: 'northernfreight.ca', phone: '(800) 461-6644', tags: ['long-haul', 'provincial routes'] },
  { id: 'S10', name: 'Michigan Aggregates', city: 'Detroit, MI', country: 'US', coords: [42.33, -83.05], categories: ['aggregates', 'freight'], rating: 4.5, code: 'MA', website: 'michiganagg.com', phone: '(313) 877-5500', tags: ['cross-border', 'bulk'] },
  { id: 'S11', name: 'Buffalo Equipment', city: 'Buffalo, NY', country: 'US', coords: [42.89, -78.88], categories: ['rental'], rating: 4.4, code: 'BF', website: 'buffaloequip.com', phone: '(716) 842-6600', tags: ['US support', 'compact fleet'] },
  { id: 'S12', name: 'Brock Aggregates', city: 'Whitby, ON', country: 'CA', coords: [43.88, -78.95], categories: ['aggregates'], rating: 4.4, code: 'BA', website: 'brockaggregates.com', phone: '(905) 665-4401', tags: ['stone supply', 'regional'] }
];

export const PROJECTS = [
  { id: 'PRJ-204', name: 'Highway Drainage Retrofit', location: 'Milton, ON', stage: 'Comparing quotes', budget: '$1.8M', supplierCount: 6, updated: '10m ago', categories: ['aggregates', 'freight'] },
  { id: 'PRJ-198', name: 'Industrial Yard Expansion', location: 'Hamilton, ON', stage: 'Awarded', budget: '$4.2M', supplierCount: 11, updated: '1h ago', categories: ['rental', 'freight'] },
  { id: 'PRJ-187', name: 'Municipal Streetscape', location: 'Brampton, ON', stage: 'RFQ in progress', budget: '$920K', supplierCount: 4, updated: 'Today', categories: ['aggregates'] },
  { id: 'PRJ-172', name: 'Stormwater Basin Works', location: 'London, ON', stage: 'Scheduling', budget: '$2.4M', supplierCount: 7, updated: 'Yesterday', categories: ['freight', 'rental'] }
];

export const MESSAGES = [
  { id: 'M1', from: 'Dufferin Aggregates', subject: 'Quote ready for Highway Drainage Retrofit', time: '7 min ago', preview: 'Delivered rate and haul windows updated for the Milton site.' },
  { id: 'M2', from: 'Battlefield Equipment', subject: 'Loader availability confirmed', time: '42 min ago', preview: 'Compact loader can be staged for pickup tomorrow morning.' },
  { id: 'M3', from: 'NorthernFreight', subject: 'Freight lane update', time: '2h ago', preview: 'Cross-border lane is open with adjusted transit estimates.' },
  { id: 'M4', from: 'Project Admin', subject: 'Missing supplier docs', time: 'Today', preview: 'Insurance certificate still pending for two vendors.' }
];

export const METRICS = [
  { label: 'Active projects', value: '18', hint: '+3 this week' },
  { label: 'Open quotes', value: '42', hint: '11 awaiting response' },
  { label: 'Estimated savings', value: '$84K', hint: 'vs baseline rates' },
  { label: 'Supplier network', value: '126', hint: 'CA + US coverage' }
];

export const PORTAL_LEADS = [
  { title: 'Milton Drainage Retrofit', note: 'Aggregate + freight package', status: 'New lead', priority: 'High' },
  { title: 'Hamilton Yard Expansion', note: 'Rental and logistics required', status: 'Awaiting response', priority: 'Medium' },
  { title: 'Brampton Streetscape', note: 'Material-only comparison', status: 'Drafted', priority: 'Low' }
];
