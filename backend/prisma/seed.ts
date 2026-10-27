import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function seedDatabase() {
  return main();
}

async function main() {
  console.log('🌱 Starting JANRAKSHA AI Synthetic Demo Data Seeding...');

  // 1. Clear existing records to ensure clean state
  await prisma.duplicateCandidate.deleteMany();
  await prisma.caseNote.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.grievance.deleteMany();
  await prisma.incidentCluster.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 2. Seed Departments
  console.log('Building civic departments...');
  const deptPwd = await prisma.department.create({
    data: {
      code: 'PWD',
      name: 'Road Construction & Public Works (RCD/PWD)',
      description: 'Highway repairs, pothole filling, bridge safety, asphalt laying',
      slaHours: 48,
      headOfficer: 'Chief Engineer R. K. Srivastava',
      contactEmail: 'pwd.support@bihar.gov.in',
      contactPhone: '+91 612 2223344',
      colorHex: '#3B82F6', // Electric blue
    },
  });

  const deptDrainage = await prisma.department.create({
    data: {
      code: 'DRAINAGE',
      name: 'Urban Drainage & Flood Mitigation Division',
      description: 'Sump house operations, storm drain unblocking, waterlogging mitigation',
      slaHours: 24,
      headOfficer: 'Superintending Engineer Amit Pathak',
      contactEmail: 'drainage.control@bihar.gov.in',
      contactPhone: '+91 612 2255667',
      colorHex: '#06B6D4', // Cyan
    },
  });

  const deptSwm = await prisma.department.create({
    data: {
      code: 'SWM',
      name: 'Municipal Solid Waste & Sanitation Bureau',
      description: 'Garbage collection, open dump removal, community bin sanitization',
      slaHours: 36,
      headOfficer: 'Municipal Executive Officer Priya Sinha',
      contactEmail: 'swm.cleancity@bihar.gov.in',
      contactPhone: '+91 612 2288990',
      colorHex: '#10B981', // Emerald green
    },
  });

  const deptWss = await prisma.department.create({
    data: {
      code: 'WSS',
      name: 'Water Supply & Public Health Engineering (PHED)',
      description: 'Drinking water pipeline maintenance, contamination check, pump repair',
      slaHours: 24,
      headOfficer: 'Director PHED Suresh Sharma',
      contactEmail: 'phed.water@bihar.gov.in',
      contactPhone: '+91 612 2299112',
      colorHex: '#0284C7', // Sky blue
    },
  });

  const deptElec = await prisma.department.create({
    data: {
      code: 'ELEC',
      name: 'Bihar State Power Holding Company (BSPHCL)',
      description: 'Transformer repairs, live-wire hazards, feeder breakdown, streetlights',
      slaHours: 12,
      headOfficer: 'Executive Engineer Vinod Choudhary',
      contactEmail: 'power.dispatch@bihar.gov.in',
      contactPhone: '+91 612 2544332',
      colorHex: '#F59E0B', // Amber
    },
  });

  const deptPolice = await prisma.department.create({
    data: {
      code: 'POLICE',
      name: 'Bihar Police Civic Order & Traffic Command',
      description: 'Traffic bottlenecks, public safety escorts, dark-spot surveillance',
      slaHours: 6,
      headOfficer: 'SP Traffic Patna City',
      contactEmail: 'traffic.control@biharpolice.gov.in',
      contactPhone: '+91 612 2211100',
      colorHex: '#EF4444', // Red
    },
  });

  // 3. Seed Demo Personas / Users
  console.log('Seeding demo persona accounts...');
  const userAdmin = await prisma.user.create({
    data: {
      name: 'ADG Rajesh Verma (IPS)',
      email: 'admin@biharpolice.gov.in',
      role: 'SUPER_ADMIN',
      badgeNumber: 'IPS-PAT-001',
      phone: '+91 98350 11223',
    },
  });

  const userDm = await prisma.user.create({
    data: {
      name: 'Dr. Ananya Sen (IAS)',
      email: 'dm.patna@bihar.gov.in',
      role: 'DISTRICT_MAGISTRATE',
      district: 'Patna Central',
      badgeNumber: 'IAS-PAT-014',
      phone: '+91 98350 22334',
    },
  });

  const userPwdOfficer = await prisma.user.create({
    data: {
      name: 'Er. Manoj Kumar',
      email: 'officer.pwd@bihar.gov.in',
      role: 'DEPARTMENT_OFFICER',
      departmentId: deptPwd.id,
      district: 'Patna Central',
      badgeNumber: 'PWD-EE-409',
      phone: '+91 98350 33445',
    },
  });

  const userElecOfficer = await prisma.user.create({
    data: {
      name: 'Er. Sunita Kumari',
      email: 'officer.elec@bihar.gov.in',
      role: 'DEPARTMENT_OFFICER',
      departmentId: deptElec.id,
      district: 'Patna Central',
      badgeNumber: 'BSPHCL-EE-112',
      phone: '+91 98350 44556',
    },
  });

  const userInspector = await prisma.user.create({
    data: {
      name: 'Inspector Vikram Singh',
      email: 'field.inspector@bihar.gov.in',
      role: 'FIELD_INVESTIGATOR',
      district: 'Patna Central',
      badgeNumber: 'BP-INSP-882',
      phone: '+91 98350 55667',
    },
  });

  // 4. Seed Incident Clusters
  console.log('Creating Incident Clusters for multi-report grouping...');
  const clusterBailey = await prisma.incidentCluster.create({
    data: {
      clusterCode: 'CLUST-PATNA-001',
      title: 'Bailey Road Flyover Storm Drain Choke',
      description: 'Multiple reports of 3-foot waterlogging below pillar 42 causing traffic gridlock toward Saguna More',
      category: 'WATERLOGGING',
      district: 'Patna Central',
      locality: 'Bailey Road',
      rootCause: 'Sump motor trip at Rukanpura outlet coupled with choked 48-inch storm culvert',
      severity: 'HIGH',
      status: 'DISPATCHED',
      centerLat: 25.6125,
      centerLng: 85.0872,
      radiusMeters: 450,
    },
  });

  const clusterKankarbagh = await prisma.incidentCluster.create({
    data: {
      clusterCode: 'CLUST-PATNA-002',
      title: 'Kankarbagh Main Colony 11kV Arcing & Spark Hazard',
      description: 'Overloaded 11kV step-down transformer sparking intermittently over vegetable market',
      category: 'ELECTRICITY',
      district: 'Patna Central',
      locality: 'Kankarbagh',
      rootCause: 'High moisture degradation on bushing insulator resulting in continuous dielectric breakdown',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      centerLat: 25.5962,
      centerLng: 85.1558,
      radiusMeters: 300,
    },
  });

  const clusterGayaPipe = await prisma.incidentCluster.create({
    data: {
      clusterCode: 'CLUST-GAYA-001',
      title: 'Station Road Gaya Trunk Water Main Rupture',
      description: 'Severe potable water pipeline burst flooding rail approach and contaminating nearby borewells',
      category: 'WATER_SUPPLY',
      district: 'Gaya City',
      locality: 'Station Road',
      rootCause: 'Excavation impact by unauthorized fiber laying trenching contractor',
      severity: 'HIGH',
      status: 'INVESTIGATING',
      centerLat: 24.8021,
      centerLng: 85.0084,
      radiusMeters: 350,
    },
  });

  // 5. Seed Grievances with rich synthetic cases (Bilingual English & Hindi)
  console.log('Seeding synthetic bilingual citizen grievances...');

  const complaints = [
    // Cluster 1: Bailey Road Waterlogging Cases
    {
      trackingId: 'JAN-2026-1011',
      title: 'Massive waterlogging under Bailey Road flyover near pillar 42',
      description: 'Heavy rainfall yesterday has completely flooded the underpass. 2.5 feet water standing, school vans and ambulances stuck in traffic.',
      originalLanguage: 'en',
      category: 'WATERLOGGING',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      complainantName: 'Rameshwar Prasad (Fictional Citizen)',
      complainantPhone: '+91 94310 11001',
      district: 'Patna Central',
      locality: 'Bailey Road',
      address: 'Pillar 42, Bailey Road Flyover Junction, Patna',
      landmark: 'Opposite Paras HMRI Hospital lane',
      lat: 25.6128,
      lng: 85.0874,
      deptId: deptDrainage.id,
      clusterId: clusterBailey.id,
      assignedTo: userInspector.id,
      confidence: 0.96,
      slaHoursRemaining: 18,
      ai: {
        sentiment: 'Urgent',
        urgencyScore: 8,
        priorityReason: 'Critical arterial road submerged; high impact on emergency ambulance route',
        keywords: ['waterlogging', 'flooded', 'ambulance', 'traffic'],
        locations: ['Bailey Road', 'Pillar 42'],
      },
    },
    {
      trackingId: 'JAN-2026-1012',
      title: 'बेली रोड फ्लाईओवर के नीचे भयंकर जलजमाव और नाला ओवरफ्लो',
      description: 'रुकनपुरा की तरफ जाने वाले रास्ते पर 3 फीट गंदा पानी भरा हुआ है। नाली चोक हो गई है और बदबू आ रही है। गाड़ियां बंद हो रही हैं।',
      originalLanguage: 'hi',
      category: 'WATERLOGGING',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      complainantName: 'सुरेश कुमार यादव (काल्पनिक नागरिक)',
      complainantPhone: '+91 94310 11002',
      district: 'Patna Central',
      locality: 'Bailey Road',
      address: 'रुकनपुरा मोड़, बेली रोड, पटना',
      landmark: 'रुकनपुरा पेट्रोल पंप के पास',
      lat: 25.6121,
      lng: 85.0869,
      deptId: deptDrainage.id,
      clusterId: clusterBailey.id,
      assignedTo: userInspector.id,
      confidence: 0.94,
      slaHoursRemaining: 19,
      ai: {
        sentiment: 'Distressed',
        urgencyScore: 8,
        priorityReason: 'सड़क अवरोध और जलभराव के एकाधिक नागरिक शिकायतें प्राप्त',
        keywords: ['जलजमाव', 'नाला ओवरफ्लो', 'गंदा पानी', 'ट्रैफिक जाम'],
        locations: ['Bailey Road', 'Rukanpura'],
      },
    },
    {
      trackingId: 'JAN-2026-1013',
      title: 'Storm drain clogged, drainage water backflowing into storefronts on Bailey Road',
      description: 'The municipal drain outlet is blocked with polythene and silt. Water is now seeping into shops and residential basements.',
      originalLanguage: 'en',
      category: 'WATERLOGGING',
      severity: 'MEDIUM',
      status: 'ASSIGNED',
      complainantName: 'Alok Ranjan (Fictional Trader)',
      complainantPhone: '+91 94310 11003',
      district: 'Patna Central',
      locality: 'Bailey Road',
      address: 'Shop No 14, Commercial Complex, Bailey Road',
      landmark: 'Near Rukanpura flyover ramp',
      lat: 25.6132,
      lng: 85.0879,
      deptId: deptDrainage.id,
      clusterId: clusterBailey.id,
      assignedTo: null,
      confidence: 0.92,
      slaHoursRemaining: 34,
      ai: {
        sentiment: 'Frustrated',
        urgencyScore: 6,
        priorityReason: 'Commercial property ingress risk from unresolved storm drain choke',
        keywords: ['drain clogged', 'backflow', 'basement'],
        locations: ['Bailey Road'],
      },
    },

    // Cluster 2: Kankarbagh Transformer Hazard (CRITICAL)
    {
      trackingId: 'JAN-2026-1021',
      title: '11kV Transformer throwing continuous sparks over Sabzi Mandi crowd',
      description: 'CRITICAL: High tension transformer at Kankarbagh Tempo Stand is loudly buzzing and dropping hot molten sparks on vegetable vendors and pedestrians. Immediate fire risk!',
      originalLanguage: 'en',
      category: 'ELECTRICITY',
      severity: 'CRITICAL',
      status: 'ASSIGNED',
      complainantName: 'Deepak Mishra (Fictional Citizen)',
      complainantPhone: '+91 94310 22001',
      district: 'Patna Central',
      locality: 'Kankarbagh',
      address: 'Tempo Stand Roundabout, Kankarbagh Colony, Patna',
      landmark: 'Adjacent to Vegetable Market gate',
      lat: 25.5964,
      lng: 85.1559,
      deptId: deptElec.id,
      clusterId: clusterKankarbagh.id,
      assignedTo: userElecOfficer.id,
      confidence: 0.98,
      slaHoursRemaining: 6,
      ai: {
        sentiment: 'Distressed',
        urgencyScore: 10,
        priorityReason: 'Extreme public safety hazard: live electrical sparks in dense commercial area',
        keywords: ['spark', 'fire', 'transformer', 'critical', 'emergency'],
        locations: ['Kankarbagh', 'Tempo Stand'],
      },
    },
    {
      trackingId: 'JAN-2026-1022',
      title: 'कंकड़बाग टेंपो स्टैंड के पास ट्रांसफार्मर में जोरदार स्पार्क और धुआं',
      description: 'बिजली का तार बहुत नीचे लटक रहा है और ट्रांसफार्मर से चिंगारी निकल रही है। बड़ा हादसा हो सकता है। तुरंत लाइन कटवाकर मरम्मत कराई जाए!',
      originalLanguage: 'hi',
      category: 'ELECTRICITY',
      severity: 'CRITICAL',
      status: 'OPEN',
      complainantName: 'रवि प्रकाश चौबे (काल्पनिक निवासी)',
      complainantPhone: '+91 94310 22002',
      district: 'Patna Central',
      locality: 'Kankarbagh',
      address: 'मेन रोड, कंकड़बाग, पटना',
      landmark: 'हनुमान मंदिर के सामने वाला खंभा',
      lat: 25.5960,
      lng: 85.1555,
      deptId: deptElec.id,
      clusterId: clusterKankarbagh.id,
      assignedTo: null,
      confidence: 0.97,
      slaHoursRemaining: 8,
      ai: {
        sentiment: 'Distressed',
        urgencyScore: 10,
        priorityReason: 'करंट और आग की गंभीर आशंका: अति-संवेदनशील भीड़भाड़ वाला क्षेत्र',
        keywords: ['स्पार्क', 'धुआं', 'तार टूटा', 'हादसा', 'करंट'],
        locations: ['Kankarbagh'],
      },
    },
    {
      trackingId: 'JAN-2026-1023',
      title: 'Frequent blackout and burning rubber smell from Kankarbagh feeder substation',
      description: 'The whole block has been experiencing brownouts since 4 PM. Residents report sharp acrid smell of burnt transformer oil.',
      originalLanguage: 'en',
      category: 'ELECTRICITY',
      severity: 'HIGH',
      status: 'OPEN',
      complainantName: 'Smt. Manju Devi (Fictional Resident)',
      complainantPhone: '+91 94310 22003',
      district: 'Patna Central',
      locality: 'Kankarbagh',
      address: 'Lane 4, Colony More, Kankarbagh',
      landmark: 'Near DAV Public School branch',
      lat: 25.5967,
      lng: 85.1563,
      deptId: deptElec.id,
      clusterId: clusterKankarbagh.id,
      assignedTo: null,
      confidence: 0.91,
      slaHoursRemaining: 11,
      ai: {
        sentiment: 'Urgent',
        urgencyScore: 8,
        priorityReason: 'Feeder insulation degradation correlating with transformer spark incident',
        keywords: ['blackout', 'burning smell', 'feeder'],
        locations: ['Kankarbagh'],
      },
    },

    // Cluster 3: Gaya Station Road Water Pipe Rupture
    {
      trackingId: 'JAN-2026-1031',
      title: 'Major drinking water pipe cracked near Gaya Railway Station entrance',
      description: 'High pressure municipal water main has burst open. Clean drinking water gushing onto the road while surrounding colonies have zero supply.',
      originalLanguage: 'en',
      category: 'WATER_SUPPLY',
      severity: 'HIGH',
      status: 'ASSIGNED',
      complainantName: 'Kailash Prasad (Fictional Commuter)',
      complainantPhone: '+91 94310 33001',
      district: 'Gaya City',
      locality: 'Station Road',
      address: 'Main Station Approach, Station Road, Gaya',
      landmark: 'Outside Gate 2 Railway Station',
      lat: 24.8023,
      lng: 85.0086,
      deptId: deptWss.id,
      clusterId: clusterGayaPipe.id,
      assignedTo: null,
      confidence: 0.95,
      slaHoursRemaining: 17,
      ai: {
        sentiment: 'Urgent',
        urgencyScore: 7,
        priorityReason: 'Major trunk pipeline failure impacting essential railway passenger precinct',
        keywords: ['pipe burst', 'drinking water', 'railway station'],
        locations: ['Gaya', 'Station Road'],
      },
    },
    {
      trackingId: 'JAN-2026-1032',
      title: 'गया स्टेशन रोड पर पेयजल की मुख्य लाइन फटने से हजारों लीटर पानी बर्बाद',
      description: 'सड़क पर कीचड़ जमा हो गया है और घरों में नल का पानी पूरी तरह बंद है। कृपया तुरंत लाइन वॉल्व बंद करके वेल्डिंग की जाए।',
      originalLanguage: 'hi',
      category: 'WATER_SUPPLY',
      severity: 'HIGH',
      status: 'OPEN',
      complainantName: 'अशोक कुमार सिंह (काल्पनिक स्थानीय)',
      complainantPhone: '+91 94310 33002',
      district: 'Gaya City',
      locality: 'Station Road',
      address: 'स्टेशन रोड, गया जंक्शन के पास',
      landmark: 'होटल सम्राट के सामने',
      lat: 24.8019,
      lng: 85.0081,
      deptId: deptWss.id,
      clusterId: clusterGayaPipe.id,
      assignedTo: null,
      confidence: 0.93,
      slaHoursRemaining: 21,
      ai: {
        sentiment: 'Urgent',
        urgencyScore: 7,
        priorityReason: 'शहरी पेयजल आपूर्ति ठप होने और जल रिसाव की शिकायत',
        keywords: ['पेयजल', 'पाइप फटा', 'पानी बर्बाद', 'गया जंक्शन'],
        locations: ['Gaya', 'Station Road'],
      },
    },

    // Individual Cases Across Categories & Districts
    {
      trackingId: 'JAN-2026-1041',
      title: 'Deep crater potholes on Boring Canal Road causing two-wheeler skids',
      description: 'Multiple 10-inch potholes formed after utility digging. Yesterday two commuters slipped during peak hours. Urgent cold-mix filling needed.',
      originalLanguage: 'en',
      category: 'ROAD_DAMAGE',
      severity: 'MEDIUM',
      status: 'IN_PROGRESS',
      complainantName: 'Neha Verma (Fictional Resident)',
      complainantPhone: '+91 94310 44001',
      district: 'Patna Central',
      locality: 'Boring Canal Road',
      address: 'Near Panchmukhi Hanuman Mandir, Boring Canal Road',
      landmark: 'Panchmukhi Mandir Turn',
      lat: 25.6174,
      lng: 85.1142,
      deptId: deptPwd.id,
      clusterId: null,
      assignedTo: userPwdOfficer.id,
      confidence: 0.93,
      slaHoursRemaining: 30,
      ai: {
        sentiment: 'Frustrated',
        urgencyScore: 6,
        priorityReason: 'Accident hazard for commuter traffic on busy urban transit link',
        keywords: ['pothole', 'skid', 'accident', 'utility digging'],
        locations: ['Boring Canal Road'],
      },
    },
    {
      trackingId: 'JAN-2026-1042',
      title: 'बोरिंग केनाल रोड पर खुले मैनहोल और टूटी सड़क की शिकायत',
      description: 'नाला निर्माण के बाद सड़क का बड़ा हिस्सा टूटा छोड़ दिया गया है। रात के अंधेरे में कभी भी बड़ी दुर्घटना हो सकती है।',
      originalLanguage: 'hi',
      category: 'ROAD_DAMAGE',
      severity: 'HIGH',
      status: 'ASSIGNED',
      complainantName: 'संतोष कुमार (काल्पनिक नागरिक)',
      complainantPhone: '+91 94310 44002',
      district: 'Patna Central',
      locality: 'Boring Canal Road',
      address: 'बोरिंग केनाल रोड, राजापुर पुल के पास',
      landmark: 'राजापुर पुल तिराहा',
      lat: 25.6190,
      lng: 85.1160,
      deptId: deptPwd.id,
      clusterId: null,
      assignedTo: userPwdOfficer.id,
      confidence: 0.95,
      slaHoursRemaining: 20,
      ai: {
        sentiment: 'Distressed',
        urgencyScore: 8,
        priorityReason: 'खुले मैनहोल और अंधेरे से जानलेवा दुर्घटना की आशंका',
        keywords: ['सड़क टूटा', 'मैनहोल खुला', 'दुर्घटना', 'अंधेरा'],
        locations: ['Boring Canal Road'],
      },
    },
    {
      trackingId: 'JAN-2026-1051',
      title: 'Fraser Road huge rotting garbage mound outside government girls high school',
      description: 'Solid waste has not been collected for 5 days. Foul smell entering classrooms, stray cattle and dog menace posing danger to children.',
      originalLanguage: 'en',
      category: 'GARBAGE_WASTE',
      severity: 'HIGH',
      status: 'OPEN',
      complainantName: 'Poonam Kumari (Fictional Teacher)',
      complainantPhone: '+91 94310 55001',
      district: 'Patna Central',
      locality: 'Fraser Road',
      address: 'Opposite Bank Road junction, Fraser Road, Patna',
      landmark: 'Government Girls High School boundary wall',
      lat: 25.6085,
      lng: 85.1412,
      deptId: deptSwm.id,
      clusterId: null,
      assignedTo: null,
      confidence: 0.97,
      slaHoursRemaining: 26,
      ai: {
        sentiment: 'Distressed',
        urgencyScore: 8,
        priorityReason: 'Sanitation emergency adjoining educational institution with health risks',
        keywords: ['garbage dump', 'foul smell', 'school', 'children', 'stray dogs'],
        locations: ['Fraser Road'],
      },
    },
    {
      trackingId: 'JAN-2026-1052',
      title: 'फ्रेज़र रोड पर कूड़े का अंबार और मरे हुए जानवरों की दुर्गंध',
      description: 'नगर निगम की गाड़ी पिछले एक हफ्ते से नहीं आई है। स्कूल के गेट पर कचरे का ढेर लगा है। छात्र-छात्राओं का सांस लेना दूभर हो गया है।',
      originalLanguage: 'hi',
      category: 'GARBAGE_WASTE',
      severity: 'HIGH',
      status: 'ASSIGNED',
      complainantName: 'राजीव रंजन (काल्पनिक अभिभावक)',
      complainantPhone: '+91 94310 55002',
      district: 'Patna Central',
      locality: 'Fraser Road',
      address: 'फ्रेज़र रोड, डाक बंगला चौराहा की ओर',
      landmark: 'स्कूल गेट के सामने',
      lat: 25.6079,
      lng: 85.1408,
      deptId: deptSwm.id,
      clusterId: null,
      assignedTo: null,
      confidence: 0.96,
      slaHoursRemaining: 22,
      ai: {
        sentiment: 'Frustrated',
        urgencyScore: 8,
        priorityReason: 'शैक्षणिक संस्थान के पास कूड़ा डंपिंग और संक्रामक रोगों का खतरा',
        keywords: ['कचरा', 'कूड़े का अंबार', 'दुर्गंध', 'स्कूल'],
        locations: ['Fraser Road'],
      },
    },
    {
      trackingId: 'JAN-2026-1061',
      title: 'Broken high-mast streetlight creating complete dark hotspot on Anisabad Golambar',
      description: 'The roundabout has 12 unlit lamps for 2 weeks. Several chain-snatching attempts reported near the bus shelter after 8 PM.',
      originalLanguage: 'en',
      category: 'PUBLIC_SAFETY',
      severity: 'HIGH',
      status: 'VERIFICATION',
      complainantName: 'Sanjay Kumar (Fictional Citizen)',
      complainantPhone: '+91 94310 66001',
      district: 'Patna Central',
      locality: 'Anisabad',
      address: 'Anisabad Roundabout, Bypass Link, Patna',
      landmark: 'Near Anisabad Police Outpost',
      lat: 25.5781,
      lng: 85.0934,
      deptId: deptPolice.id,
      clusterId: null,
      assignedTo: userInspector.id,
      confidence: 0.94,
      slaHoursRemaining: 4,
      ai: {
        sentiment: 'Urgent',
        urgencyScore: 7,
        priorityReason: 'Crime vulnerable black-spot reported along transit corridor',
        keywords: ['dark street', 'street light', 'theft', 'women safety'],
        locations: ['Anisabad'],
      },
    },
    {
      trackingId: 'JAN-2026-1071',
      title: 'Muzaffarpur Zero Mile major intersection road cave-in',
      description: 'Heavy asphalt subsidence across 15 meters on NH approach. Trucks getting tilted. Traffic police diverting one lane.',
      originalLanguage: 'en',
      category: 'ROAD_DAMAGE',
      severity: 'CRITICAL',
      status: 'IN_PROGRESS',
      complainantName: 'Md. Tariq (Fictional Transporter)',
      complainantPhone: '+91 94310 77001',
      district: 'Muzaffarpur North',
      locality: 'Zero Mile',
      address: 'Zero Mile Chowk, NH-28 Connector, Muzaffarpur',
      landmark: 'Beside North Bihar Transport Hub',
      lat: 26.1341,
      lng: 85.3882,
      deptId: deptPwd.id,
      clusterId: null,
      assignedTo: null,
      confidence: 0.98,
      slaHoursRemaining: 8,
      ai: {
        sentiment: 'Distressed',
        urgencyScore: 9,
        priorityReason: 'Structural road subsidence on major national freight corridor',
        keywords: ['cave-in', 'heavy vehicle hazard', 'nh approach'],
        locations: ['Muzaffarpur', 'Zero Mile'],
      },
    },
    {
      trackingId: 'JAN-2026-1081',
      title: 'Bhagalpur East open stagnant storm drain breeding dengue mosquitoes',
      description: 'Stagnant foul drain near ward 14 health center. Multiple local families reported hospitalized with high dengue fevers. Urgent anti-larval fogging needed.',
      originalLanguage: 'en',
      category: 'HEALTH_SANITATION',
      severity: 'MEDIUM',
      status: 'OPEN',
      complainantName: 'Sunil Jha (Fictional Resident)',
      complainantPhone: '+91 94310 88001',
      district: 'Bhagalpur East',
      locality: 'Rajendra Nagar',
      address: 'Ward 14, Main Road, Bhagalpur',
      landmark: 'Near Primary Health Centre',
      lat: 25.2450,
      lng: 86.9855,
      deptId: deptDrainage.id,
      clusterId: null,
      assignedTo: null,
      confidence: 0.90,
      slaHoursRemaining: 42,
      ai: {
        sentiment: 'Frustrated',
        urgencyScore: 5,
        priorityReason: 'Vector-borne health hazard near primary medical clinic',
        keywords: ['dengue', 'mosquitoes', 'fogging', 'health center'],
        locations: ['Bhagalpur', 'Rajendra Nagar'],
      },
    },
    // Successfully Resolved Showcase Case
    {
      trackingId: 'JAN-2026-1091',
      title: 'Ashok Rajpath broken water valve repaired and street restored',
      description: 'Leaking underground valve outside Patna Science College gate was spilling thousands of gallons and washing away road sub-base.',
      originalLanguage: 'en',
      category: 'WATER_SUPPLY',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      complainantName: 'Prof. S. N. Ray (Fictional Complainant)',
      complainantPhone: '+91 94310 99001',
      district: 'Patna Central',
      locality: 'Ashok Rajpath',
      address: 'Opposite Patna Science College Gate, Ashok Rajpath',
      landmark: 'Science College boundary',
      lat: 25.6202,
      lng: 85.1685,
      deptId: deptWss.id,
      clusterId: null,
      assignedTo: userPwdOfficer.id,
      confidence: 0.95,
      slaHoursRemaining: 0,
      ai: {
        sentiment: 'Neutral',
        urgencyScore: 5,
        priorityReason: 'Valve integrity restored within SLA; post-resolution telemetry verified',
        keywords: ['valve repaired', 'restored', 'science college'],
        locations: ['Ashok Rajpath'],
      },
      resolvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      resolutionNote: 'Executive Engineer team deployed 300mm cast iron sleeve replacement. Valve pressurized at 4.2 bar with zero leakage. Trench backfilled with bitumen cold-mix. Citizen contacted and confirmed full restoration.',
    },
    {
      trackingId: 'JAN-2026-1092',
      title: 'दरभंगा में स्टेशन रोड पर कचरा डंपिंग की समस्या का समाधान',
      description: 'स्टेशन रोड पर मुख्य बाजार के सामने कचरा पड़ा रहता था। स्थानीय दुकानदारों ने सफाई की मांग की थी।',
      originalLanguage: 'hi',
      category: 'GARBAGE_WASTE',
      severity: 'LOW',
      status: 'RESOLVED',
      complainantName: 'महेश चंद्र मिश्र (काल्पनिक व्यापारी)',
      complainantPhone: '+91 94310 99002',
      district: 'Darbhanga West',
      locality: 'Station Road',
      address: 'स्टेशन रोड, दरभंगा',
      landmark: 'टावर चौक के निकट',
      lat: 26.1542,
      lng: 85.8918,
      deptId: deptSwm.id,
      clusterId: null,
      assignedTo: null,
      confidence: 0.91,
      slaHoursRemaining: 0,
      ai: {
        sentiment: 'Neutral',
        urgencyScore: 4,
        priorityReason: 'सफाई अभियान पूर्ण और नियमित कंटेनर स्थापित',
        keywords: ['कचरा', 'सफाई', 'दरभंगा स्टेशन'],
        locations: ['Darbhanga', 'Station Road'],
      },
      resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      resolutionNote: 'नगर निगम की टीम द्वारा विशेष स्वच्छता अभियान चलाकर 4 टन कचरा निस्तारित किया गया। 2 नए 1100 लीटर स्टील डस्टबिन स्थापित किए गए हैं।',
    },
  ];

  for (const c of complaints) {
    const loc = await prisma.location.create({
      data: {
        latitude: c.lat,
        longitude: c.lng,
        address: c.address,
        locality: c.locality,
        landmark: c.landmark,
        district: c.district,
        confidence: c.confidence,
      },
    });

    const hours = c.slaHoursRemaining || 48;
    const slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    const grievance = await prisma.grievance.create({
      data: {
        trackingId: c.trackingId,
        title: c.title,
        description: c.description,
        originalLanguage: c.originalLanguage,
        category: c.category,
        severity: c.severity,
        status: c.status,
        complainantName: c.complainantName,
        complainantPhone: c.complainantPhone,
        isAnonymous: false,
        locationId: loc.id,
        departmentId: c.deptId,
        assignedOfficerId: c.assignedTo,
        incidentClusterId: c.clusterId,
        slaDeadline,
        resolvedAt: c.resolvedAt || null,
        resolutionNote: c.resolutionNote || null,
      },
    });

    // Store AI Analysis
    await prisma.aIAnalysis.create({
      data: {
        grievanceId: grievance.id,
        category: c.category,
        categoryConfidence: c.confidence,
        priority: c.severity,
        priorityReason: c.ai.priorityReason,
        sentiment: c.ai.sentiment,
        sentimentScore: c.ai.sentiment === 'Distressed' ? -0.85 : c.ai.sentiment === 'Urgent' ? -0.7 : -0.2,
        urgencyScore: c.ai.urgencyScore,
        entitiesJson: JSON.stringify({
          locations: c.ai.locations,
          district: c.district,
          keywords: c.ai.keywords,
        }),
        duplicateScore: c.clusterId ? 0.88 : 0.05,
        isDuplicateCandidate: !!c.clusterId,
        duplicateReason: c.clusterId ? 'Matched geographic cluster with multiple concurrent reports' : null,
        engineMode: 'DEMO_RULE_BASED',
      },
    });

    // Initial audit entry
    await prisma.auditLog.create({
      data: {
        action: 'GRIEVANCE_SEEDED',
        actorId: 'system-seed',
        actorName: 'Synthetic Demo Generator (PS-04)',
        actorRole: 'SYSTEM',
        entityType: 'GRIEVANCE',
        entityId: grievance.id,
        newValues: JSON.stringify({
          trackingId: c.trackingId,
          title: c.title,
          category: c.category,
          severity: c.severity,
          status: c.status,
        }),
      },
    });

    // If case has notes or is in progress, add realistic official note
    if (c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED') {
      await prisma.caseNote.create({
        data: {
          grievanceId: grievance.id,
          authorId: userAdmin.id,
          authorName: userAdmin.name,
          authorRole: userAdmin.role,
          noteText: `Field dispatch acknowledged. Inspection team designated with high-priority order.`,
          isInternal: true,
        },
      });
    }

    if (c.status === 'RESOLVED') {
      await prisma.caseNote.create({
        data: {
          grievanceId: grievance.id,
          authorId: userPwdOfficer.id,
          authorName: userPwdOfficer.name,
          authorRole: userPwdOfficer.role,
          noteText: c.resolutionNote || 'Work completed per engineering specs.',
          isInternal: false,
        },
      });
    }
  }

  // 6. Seed High Priority Alerts
  console.log('Seeding initial system alerts...');
  await prisma.alert.create({
    data: {
      title: 'CRITICAL ARREST HAZARD: Kankarbagh 11kV Arcing',
      message: 'Multiple reports received regarding continuous electrical arcing above crowded Sabzi Mandi. Power shutdown advisory issued.',
      severity: 'CRITICAL',
      type: 'SEVERITY_SURGE',
      district: 'Patna Central',
      metadata: JSON.stringify({ clusterCode: 'CLUST-PATNA-002', count: 3 }),
    },
  });

  await prisma.alert.create({
    data: {
      title: 'TRAFFIC WARNING: Bailey Road Flyover Submerged',
      message: 'Storm drain blockage caused 2.5ft flood underpass at Pillar 42. Diversions deployed via Boring Road.',
      severity: 'WARNING',
      type: 'ANOMALY_CLUSTER',
      district: 'Patna Central',
      metadata: JSON.stringify({ clusterCode: 'CLUST-PATNA-001', count: 3 }),
    },
  });

  await prisma.alert.create({
    data: {
      title: 'SLA EXPIRATION WARNING: Fraser Road School Dump',
      message: 'High priority sanitation ticket approaching 6 hours to SLA breach outside Government Girls High School.',
      severity: 'WARNING',
      type: 'SLA_BREACH',
      district: 'Patna Central',
      metadata: JSON.stringify({ trackingId: 'JAN-2026-1051' }),
    },
  });

  // 7. Seed Duplicate Candidates for Interactive Review (Phase 2)
  console.log('Seeding candidate duplicate matches for official review...');
  const g1011 = await prisma.grievance.findUnique({ where: { trackingId: 'JAN-2026-1011' } });
  const g1012 = await prisma.grievance.findUnique({ where: { trackingId: 'JAN-2026-1012' } });
  const g1021 = await prisma.grievance.findUnique({ where: { trackingId: 'JAN-2026-1021' } });
  const g1022 = await prisma.grievance.findUnique({ where: { trackingId: 'JAN-2026-1022' } });

  if (g1011 && g1012) {
    await prisma.duplicateCandidate.create({
      data: {
        sourceGrievanceId: g1012.id,
        targetGrievanceId: g1011.id,
        similarityScore: 0.88,
        evidenceJson: JSON.stringify({
          textSimilarity: 0.72,
          categoryAgreement: true,
          spatialDistanceMeters: 92,
          spatialScore: 0.85,
          timeDeltaHours: 1.5,
          timeScore: 1.0,
          compositeScore: 0.88,
          explanation: 'Bilingual match: both report flooded underpass and storm drain choke near Bailey Road Pillar 42 within 92m.',
        }),
        status: 'PENDING',
      },
    });
  }

  if (g1021 && g1022) {
    await prisma.duplicateCandidate.create({
      data: {
        sourceGrievanceId: g1022.id,
        targetGrievanceId: g1021.id,
        similarityScore: 0.94,
        evidenceJson: JSON.stringify({
          textSimilarity: 0.80,
          categoryAgreement: true,
          spatialDistanceMeters: 65,
          spatialScore: 1.0,
          timeDeltaHours: 2.0,
          timeScore: 1.0,
          compositeScore: 0.94,
          explanation: 'Critical match: concurrent complaints regarding 11kV transformer arcing over vegetable market within 65m.',
        }),
        status: 'PENDING',
      },
    });
  }

  console.log('✅ JANRAKSHA AI Synthetic Demo Data successfully seeded!');
  console.log('Summary: 6 Departments, 5 Demo Personas, 3 Incident Clusters, 16 Bilingual Grievances, 3 Alerts, 2 Duplicate Candidates.');
}

if (typeof require !== 'undefined' && require.main === module) {
  main()
    .catch(e => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} else if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('seed.ts')) {
  main()
    .catch(e => {
      console.error('Seed error:', e);
      process.exit(1);
    });
}
