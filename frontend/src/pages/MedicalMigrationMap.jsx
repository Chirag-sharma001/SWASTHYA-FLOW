import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HOSPITALS, computeScores, ALL_SPECIALTIES, ALL_INSURANCE } from '../utils/hospitalData';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const DEFAULT_CENTER = [12.9716, 77.5946]; // Bengaluru
const DEFAULT_ZOOM = 12;
const PRICE_MIN = 0;
const PRICE_MAX = 12000;

const SPECIALTY_COLORS = {
  Cardiology: '#ef4444', Orthopedics: '#f97316', Neurology: '#8b5cf6',
  Oncology: '#ec4899', Psychiatry: '#14b8a6', Surgery: '#3b82f6',
  Gynecology: '#f43f5e', Pediatrics: '#22c55e', Transplant: '#a855f7',
  Gastroenterology: '#f59e0b', Nephrology: '#06b6d4', Urology: '#0ea5e9',
  'Spine Surgery': '#84cc16', 'Sports Medicine': '#10b981', Obstetrics: '#d946ef',
  Neonatology: '#fb923c', 'Robotic Surgery': '#6366f1', 'General Medicine': '#6b7280',
  Neurosurgery: '#7c3aed',
};

function deptColor(dept) {
  return SPECIALTY_COLORS[dept] || '#6b7280';
}

/* ─────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────── */
function SkeletonLoader() {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="skeleton-pulse" style={{ width: 48, height: 48, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-pulse" style={{ height: 16, borderRadius: 6, marginBottom: 8, width: '70%' }} />
              <div className="skeleton-pulse" style={{ height: 12, borderRadius: 6, width: '45%' }} />
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <div className="skeleton-pulse" style={{ height: 24, borderRadius: 20, width: 64 }} />
            <div className="skeleton-pulse" style={{ height: 24, borderRadius: 20, width: 80 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   HOSPITAL DETAIL PANEL
───────────────────────────────────────────── */
function HospitalPanel({ hospital, onClose, isMobile }) {
  const [expanded, setExpanded] = useState(false);
  if (!hospital) return null;

  const priceColor = (price) => {
    if (price <= 800) return '#16a34a';
    if (price <= 2500) return '#d97706';
    return '#dc2626';
  };

  const bedTotal = (hospital.bedAvailability.general || 0) +
    (hospital.bedAvailability.semiPrivate || 0) +
    (hospital.bedAvailability.private || 0);

  const panelStyle = isMobile ? {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: '#fff', borderRadius: '20px 20px 0 0',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
    zIndex: 1100, maxHeight: '80vh', overflowY: 'auto',
    transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)',
    paddingBottom: 24,
  } : {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: 380, background: '#fff', zIndex: 1100,
    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
    overflowY: 'auto', paddingBottom: 24,
  };

  return (
    <div style={panelStyle}>
      {/* Drag handle (mobile) */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#d1d5db' }} />
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '16px 20px 12px', background: 'linear-gradient(135deg, #0f766e, #005c55)', color: '#fff', position: 'relative' }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
          width: 32, height: 32, cursor: 'pointer', color: '#fff', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
        }}>✕</button>

        {hospital.isBestForYou && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#fef08a', color: '#92400e', borderRadius: 20, padding: '3px 10px',
            fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5,
          }}>
            ⭐ BEST FOR YOU
          </div>
        )}

        <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, lineHeight: 1.3, paddingRight: 36 }}>
          {hospital.name}
        </h2>

        <div style={{ display: 'flex', gap: 16, fontSize: 13, opacity: 0.9 }}>
          <span>⭐ {hospital.rating}</span>
          <span>📍 {hospital.distance} km</span>
          {hospital.emergency && <span style={{ color: '#fca5a5' }}>🚨 Emergency</span>}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Ayushman + Insurance */}
        <div>
          <SectionLabel>Eligibility & Insurance</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <Chip
              label={hospital.ayushmanBharat ? '✓ Ayushman Bharat' : '✗ Not Ayushman'}
              color={hospital.ayushmanBharat ? '#16a34a' : '#dc2626'}
              bg={hospital.ayushmanBharat ? '#dcfce7' : '#fee2e2'}
            />
            {hospital.insuranceProviders.map(ins => (
              <Chip key={ins} label={ins} color="#0369a1" bg="#e0f2fe" />
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div>
          <SectionLabel>Per-Bed Pricing (per night)</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
            {[['General', hospital.pricing.general], ['Semi-Private', hospital.pricing.semiPrivate], ['Private', hospital.pricing.private]].map(([label, price]) => (
              <div key={label} style={{
                background: '#f9fafb', borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                border: `1.5px solid ${priceColor(price)}30`,
              }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: priceColor(price) }}>
                  ₹{price.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Specialties quick view */}
        <div>
          <SectionLabel>Specialties</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {hospital.specialties.map(s => (
              <span key={s} style={{
                background: deptColor(s) + '18', color: deptColor(s),
                border: `1px solid ${deptColor(s)}40`,
                borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
              }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Expandable Details */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              width: '100%', background: expanded ? '#f0fdf4' : '#f9fafb',
              border: 'none', padding: '12px 16px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontWeight: 600, color: '#005c55', fontSize: 14, transition: 'background 0.2s',
            }}
          >
            <span>📋 View Full Details</span>
            <span style={{ transition: 'transform 0.25s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
          </button>

          {expanded && (
            <div style={{ padding: '16px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Doctors */}
              <div>
                <SectionLabel>Specialist Doctors</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {hospital.specialists.map(doc => (
                    <div key={doc.name} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', background: '#f9fafb', borderRadius: 8,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: deptColor(doc.dept) + '20',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16,
                      }}>👨‍⚕️</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{doc.exp} experience</div>
                      </div>
                      <span style={{
                        background: deptColor(doc.dept) + '18', color: deptColor(doc.dept),
                        border: `1px solid ${deptColor(doc.dept)}40`,
                        borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                      }}>{doc.dept}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Departments */}
              <div>
                <SectionLabel>All Departments</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {hospital.departments.map(d => (
                    <span key={d} style={{
                      background: '#f3f4f6', color: '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: 20, padding: '3px 10px', fontSize: 12,
                    }}>{d}</span>
                  ))}
                </div>
              </div>

              {/* Bed Availability */}
              <div>
                <SectionLabel>Bed Availability</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {[
                    { label: 'General Ward', key: 'general', color: '#16a34a' },
                    { label: 'Semi-Private', key: 'semiPrivate', color: '#d97706' },
                    { label: 'Private Room', key: 'private', color: '#7c3aed' },
                    { label: 'ICU', key: 'icu', color: '#dc2626' },
                  ].map(({ label, key, color }) => {
                    const count = hospital.bedAvailability[key] || 0;
                    const maxCount = Math.max(hospital.bedAvailability.general, 100);
                    const pct = Math.min((count / maxCount) * 100, 100);
                    return (
                      <div key={key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: '#6b7280' }}>{label}</span>
                          <span style={{ fontWeight: 700, color }}>{count} beds</span>
                        </div>
                        <div style={{ background: '#f3f4f6', borderRadius: 99, height: 6 }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: color, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Treatment Costs */}
              <div>
                <SectionLabel>Estimated Treatment Costs</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {Object.entries(hospital.estimatedTreatmentCost).map(([proc, cost]) => (
                    <div key={proc} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: '#f9fafb', borderRadius: 8,
                    }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{proc.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#005c55' }}>{cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic', margin: 0 }}>{hospital.description}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FILTER BAR
───────────────────────────────────────────── */
function FilterBar({ filters, onChange, totalResults }) {
  const [showSpecialties, setShowSpecialties] = useState(false);

  const toggleSpecialty = (s) => {
    const current = filters.specialties;
    onChange({
      ...filters,
      specialties: current.includes(s) ? current.filter(x => x !== s) : [...current, s],
    });
  };

  return (
    <div style={{
      background: '#fff', borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 900, position: 'relative',
    }}>
      {/* Main filter row */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', padding: '10px 16px',
        overflowX: 'auto', whiteSpace: 'nowrap',
      }}>
        {/* Ayushman toggle */}
        <button
          onClick={() => onChange({ ...filters, ayushman: !filters.ayushman })}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: filters.ayushman ? '#dcfce7' : '#f9fafb',
            color: filters.ayushman ? '#16a34a' : '#374151',
            border: `1.5px solid ${filters.ayushman ? '#86efac' : '#e5e7eb'}`,
            borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
            fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          {filters.ayushman ? '✓' : ''} Ayushman Eligible
        </button>

        {/* Emergency toggle */}
        <button
          onClick={() => onChange({ ...filters, emergencyOnly: !filters.emergencyOnly })}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: filters.emergencyOnly ? '#fee2e2' : '#f9fafb',
            color: filters.emergencyOnly ? '#dc2626' : '#374151',
            border: `1.5px solid ${filters.emergencyOnly ? '#fca5a5' : '#e5e7eb'}`,
            borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
            fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          {filters.emergencyOnly ? '✓' : ''} 🚨 Emergency
        </button>

        {/* Specialty dropdown trigger */}
        <button
          onClick={() => setShowSpecialties(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: filters.specialties.length > 0 ? '#ede9fe' : '#f9fafb',
            color: filters.specialties.length > 0 ? '#7c3aed' : '#374151',
            border: `1.5px solid ${filters.specialties.length > 0 ? '#c4b5fd' : '#e5e7eb'}`,
            borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
            fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          Specialty {filters.specialties.length > 0 ? `(${filters.specialties.length})` : ''} ▾
        </button>

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={e => onChange({ ...filters, sortBy: e.target.value })}
          style={{
            background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 20,
            padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#374151',
            cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
          }}
        >
          <option value="score">⭐ Best Match</option>
          <option value="distance">📍 Distance</option>
          <option value="rating">⭐ Rating</option>
          <option value="priceAsc">💚 Price ↑</option>
          <option value="priceDesc">💰 Price ↓</option>
        </select>

        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto', flexShrink: 0 }}>
          {totalResults} hospitals
        </span>
      </div>

      {/* Price range slider */}
      <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>Max bed price:</span>
        <input
          type="range" min={PRICE_MIN} max={PRICE_MAX} step={200}
          value={filters.maxPrice}
          onChange={e => onChange({ ...filters, maxPrice: parseInt(e.target.value) })}
          style={{ flex: 1, accentColor: '#0f766e', cursor: 'pointer' }}
        />
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#005c55',
          background: '#f0fdf4', borderRadius: 8, padding: '2px 8px', minWidth: 60, textAlign: 'center',
        }}>
          ₹{filters.maxPrice >= PRICE_MAX ? PRICE_MAX.toLocaleString() + '+' : filters.maxPrice.toLocaleString()}
        </span>
      </div>

      {/* Specialty dropdown */}
      {showSpecialties && (
        <div style={{
          position: 'absolute', top: '100%', left: 16, right: 16,
          background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb', padding: '12px', zIndex: 1000,
          display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 220, overflowY: 'auto',
        }}>
          {ALL_SPECIALTIES.map(s => (
            <button
              key={s}
              onClick={() => toggleSpecialty(s)}
              style={{
                background: filters.specialties.includes(s) ? deptColor(s) + '20' : '#f9fafb',
                color: filters.specialties.includes(s) ? deptColor(s) : '#374151',
                border: `1.5px solid ${filters.specialties.includes(s) ? deptColor(s) : '#e5e7eb'}`,
                borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
                fontSize: 12, fontWeight: filters.specialties.includes(s) ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => { onChange({ ...filters, specialties: [] }); setShowSpecialties(false); }}
            style={{
              background: '#f3f4f6', color: '#6b7280', border: 'none',
              borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontSize: 12, marginLeft: 'auto',
            }}
          >Clear</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   HOSPITAL LIST ITEM (sidebar)
───────────────────────────────────────────── */
function HospitalListItem({ hospital, isSelected, onClick }) {
  const priceColor = hospital.pricing.general <= 800 ? '#16a34a'
    : hospital.pricing.general <= 2000 ? '#d97706' : '#dc2626';

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? '#f0fdf4' : '#fff',
        border: `1.5px solid ${isSelected ? '#86efac' : '#e5e7eb'}`,
        borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
        transition: 'all 0.2s', marginBottom: 8,
        boxShadow: isSelected ? '0 0 0 2px rgba(5,150,105,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
        transform: isSelected ? 'scale(1.01)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1, paddingRight: 8 }}>
          {hospital.isBestForYou && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 2,
              background: '#fef08a', color: '#92400e', borderRadius: 20,
              padding: '1px 8px', fontSize: 10, fontWeight: 700, marginBottom: 4,
            }}>⭐ BEST FOR YOU</div>
          )}
          <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', lineHeight: 1.3 }}>
            {hospital.name}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: priceColor }}>
            ₹{hospital.pricing.general.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>gen. ward</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280' }}>
        <span>⭐ {hospital.rating}</span>
        <span>📍 {hospital.distance} km</span>
        {hospital.ayushmanBharat && <span style={{ color: '#16a34a' }}>✓ Ayushman</span>}
        {hospital.emergency && <span style={{ color: '#dc2626' }}>🚨</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
        {hospital.specialties.slice(0, 3).map(s => (
          <span key={s} style={{
            background: deptColor(s) + '15', color: deptColor(s),
            borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600,
          }}>{s}</span>
        ))}
        {hospital.specialties.length > 3 && (
          <span style={{ background: '#f3f4f6', color: '#9ca3af', borderRadius: 20, padding: '2px 8px', fontSize: 10 }}>
            +{hospital.specialties.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SMALL HELPERS
───────────────────────────────────────────── */
function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8 }}>{children}</div>;
}

function Chip({ label, color, bg }) {
  return (
    <span style={{
      background: bg, color: color,
      border: `1.5px solid ${color}30`,
      borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
    }}>{label}</span>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function MedicalMigrationMap() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerClusterRef = useRef(null);
  const markersRef = useRef({});

  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [filters, setFilters] = useState({
    ayushman: false,
    emergencyOnly: false,
    specialties: [],
    maxPrice: PRICE_MAX,
    sortBy: 'score',
  });

  // Detect mobile
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Apply filters and scoring
  useEffect(() => {
    let data = computeScores(HOSPITALS, filters.maxPrice);

    if (filters.ayushman) data = data.filter(h => h.ayushmanBharat);
    if (filters.emergencyOnly) data = data.filter(h => h.emergency);
    if (filters.specialties.length > 0) {
      data = data.filter(h => filters.specialties.some(s => h.specialties.includes(s)));
    }
    if (filters.maxPrice < PRICE_MAX) data = data.filter(h => h.pricing.general <= filters.maxPrice);

    // Mark best for you
    const sortedForBest = [...data].sort((a, b) => b.score - a.score);
    const bestId = sortedForBest[0]?.id;
    data = data.map(h => ({ ...h, isBestForYou: h.id === bestId }));

    // Sort
    switch (filters.sortBy) {
      case 'distance': data.sort((a, b) => a.distance - b.distance); break;
      case 'rating': data.sort((a, b) => b.rating - a.rating); break;
      case 'priceAsc': data.sort((a, b) => a.pricing.general - b.pricing.general); break;
      case 'priceDesc': data.sort((a, b) => b.pricing.general - a.pricing.general); break;
      default: data.sort((a, b) => b.score - a.score);
    }

    setFilteredHospitals(data);
  }, [filters]);

  // Initialise map
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    if (mapInstanceRef.current) return;

    const map = window.L.map(mapRef.current, {
      center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    window.L.control.zoom({ position: 'bottomright' }).addTo(map);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Try geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setUserLocation({ lat, lng });
          map.setView([lat, lng], 13);

          // User location marker
          const pulseIcon = window.L.divIcon({
            html: `<div style="width:16px;height:16px;background:#3b82f6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
            className: '', iconSize: [16, 16], iconAnchor: [8, 8],
          });
          window.L.marker([lat, lng], { icon: pulseIcon })
            .addTo(map)
            .bindPopup('📍 You are here');
        },
        () => setLocationError(true)
      );
    } else {
      setLocationError(true);
    }

    // Simulate loading delay
    setTimeout(() => setIsLoading(false), 800);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when filtered hospitals change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L || isLoading) return;

    // Remove old cluster
    if (markerClusterRef.current) {
      map.removeLayer(markerClusterRef.current);
    }

    const cluster = window.L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
    });

    markersRef.current = {};

    filteredHospitals.forEach(h => {
      const isBest = h.isBestForYou;
      const bgColor = isBest ? '#f59e0b' : h.ayushmanBharat ? '#059669' : '#0f766e';

      const icon = window.L.divIcon({
        html: `
          <div style="
            background:${bgColor};
            color:#fff;
            width:${isBest ? 44 : 36}px;
            height:${isBest ? 44 : 36}px;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:2.5px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            display:flex;align-items:center;justify-content:center;
            transition:all 0.2s;
          ">
            <span style="transform:rotate(45deg);font-size:${isBest ? 18 : 15}px">${isBest ? '⭐' : '🏥'}</span>
          </div>`,
        className: '', iconSize: [isBest ? 44 : 36, isBest ? 44 : 36], iconAnchor: [isBest ? 22 : 18, isBest ? 44 : 36],
      });

      const marker = window.L.marker([h.lat, h.lng], { icon });
      marker.on('click', () => setSelectedHospital(h));

      marker.bindTooltip(`<b>${h.name}</b><br/>⭐ ${h.rating} · ${h.distance} km`, {
        permanent: false, direction: 'top', offset: [0, -10],
        className: 'leaflet-tooltip-custom',
      });

      markersRef.current[h.id] = marker;
      cluster.addLayer(marker);
    });

    cluster.addTo(map);
    markerClusterRef.current = cluster;
  }, [filteredHospitals, isLoading]);

  // Pan to selected hospital
  useEffect(() => {
    if (selectedHospital && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedHospital.lat, selectedHospital.lng], 15, { animate: true });
    }
  }, [selectedHospital]);

  const handleListItemClick = useCallback((hospital) => {
    setSelectedHospital(hospital);
  }, []);

  // ── RENDER ──
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      fontFamily: "'Public Sans', sans-serif",
      color: '#111827',
    }}>
      {/* Top Nav */}
      <header style={{
        background: 'linear-gradient(135deg, #0f766e, #005c55)',
        color: '#fff', padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)', zIndex: 950, flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
            color: '#fff', cursor: 'pointer', padding: '6px 10px', fontSize: 16,
            display: 'flex', alignItems: 'center', backdropFilter: 'blur(4px)',
          }}
        >←</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>
            Medical Migration Map
          </h1>
          <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>
            Find & compare hospitals by affordability, eligibility & expertise
          </p>
        </div>
        {userLocation && (
          <span style={{
            marginLeft: 'auto', background: 'rgba(255,255,255,0.15)',
            borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}>📍 Location detected</span>
        )}
        {locationError && !userLocation && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              placeholder="Enter city..."
              value={manualCity}
              onChange={e => setManualCity(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8, color: '#fff', padding: '5px 10px', fontSize: 12,
                fontFamily: 'inherit', outline: 'none', width: 120,
              }}
            />
          </div>
        )}
      </header>

      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} totalResults={filteredHospitals.length} />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Sidebar (desktop only) */}
        {!isMobile && (
          <div style={{
            width: 340, background: '#f9fafb',
            borderRight: '1px solid #e5e7eb', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            {isLoading ? (
              <SkeletonLoader />
            ) : (
              <div style={{ padding: '12px 12px 0' }}>
                {filteredHospitals.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                    <p>No hospitals match your filters.<br />Try adjusting your criteria.</p>
                  </div>
                ) : (
                  filteredHospitals.map(h => (
                    <HospitalListItem
                      key={h.id}
                      hospital={h}
                      isSelected={selectedHospital?.id === h.id}
                      onClick={() => handleListItemClick(h)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* Map loading overlay */}
          {isLoading && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(249,250,251,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 800, backdropFilter: 'blur(4px)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, border: '4px solid #e5e7eb',
                  borderTop: '4px solid #0f766e', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
                }} />
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Loading hospitals…</p>
              </div>
            </div>
          )}

          {/* Hospital detail panel (desktop, overlays right of map) */}
          {!isMobile && selectedHospital && (
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 1100, width: 380 }}>
              <HospitalPanel hospital={selectedHospital} onClose={() => setSelectedHospital(null)} isMobile={false} />
            </div>
          )}

          {/* Mobile: floating list button */}
          {isMobile && !selectedHospital && !isLoading && (
            <div style={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              zIndex: 900,
            }}>
              <div style={{
                background: '#fff', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6,
                maxHeight: '45vh', overflowY: 'auto', width: 'calc(100vw - 48px)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>
                    {filteredHospitals.length} Nearby Hospitals
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>Tap to view</span>
                </div>
                {filteredHospitals.slice(0, 5).map(h => (
                  <HospitalListItem
                    key={h.id} hospital={h}
                    isSelected={selectedHospital?.id === h.id}
                    onClick={() => handleListItemClick(h)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && selectedHospital && (
        <HospitalPanel hospital={selectedHospital} onClose={() => setSelectedHospital(null)} isMobile={true} />
      )}

      {/* Inline styles */}
      <style>{`
        .skeleton-pulse {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .leaflet-tooltip-custom {
          background: #1f2937;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 12px;
          font-family: 'Public Sans', sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .leaflet-tooltip-custom::before {
          border-top-color: #1f2937 !important;
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
      `}</style>
    </div>
  );
}
