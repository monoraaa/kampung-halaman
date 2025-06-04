import { useEffect, useState } from 'react';
import './App.css';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RegionData {
  id: string;
  name: string;
  website: string;
}

function App() {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [formData, setFormData] = useState({ region: '', website: '' });
  const [loading, setLoading] = useState(true);
  const [titleVisible, setTitleVisible] = useState(false);

  // Load GeoJSON data
  useEffect(() => {
    fetch('/data/kabkota.json')
      .then(response => response.json())
      .then(data => {
        setGeoJsonData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading GeoJSON data:', error);
        setLoading(false);
      });
    
    // Load saved region data from localStorage
    const savedData = localStorage.getItem('regionData');
    if (savedData) {
      setRegionData(JSON.parse(savedData));
    }
    
    // Animate title after a short delay
    setTimeout(() => {
      setTitleVisible(true);
    }, 500);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.region || !formData.website) {
      alert('Mohon isi nama kota/kabupaten dan link website');
      return;
    }
    
    // Validate website URL
    if (!formData.website.startsWith('http://') && !formData.website.startsWith('https://')) {
      alert('Link website harus dimulai dengan http:// atau https://');
      return;
    }
    
    // Add new region data
    const newRegionData = [
      ...regionData,
      {
        id: Date.now().toString(),
        name: formData.region,
        website: formData.website
      }
    ];
    
    setRegionData(newRegionData);
    
    // Save to localStorage
    localStorage.setItem('regionData', JSON.stringify(newRegionData));
    
    // Reset form
    setFormData({ region: '', website: '' });
  };

  // Style function for GeoJSON
  const getStyle = (feature: any) => {
    const regionName = feature.properties.NAME_2;
    const hasWebsite = regionData.some(r => r.name.toLowerCase() === regionName.toLowerCase());
    
    return {
      fillColor: hasWebsite ? '#4CAF50' : '#9E9E9E',
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  // Function to handle each feature
  const onEachFeature = (feature: any, layer: L.Layer) => {
    const regionName = feature.properties.NAME_2;
    const regionData = getRegionDataByName(regionName);
    
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.9
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(getStyle(feature));
      }
    });
    
    if (regionData) {
      layer.bindTooltip(`
        <div class="tooltip-content">
          <h3>${regionName}</h3>
          <a href="${regionData.website}" target="_blank">Kunjungi Website</a>
        </div>
      `, { sticky: true });
    } else {
      layer.bindTooltip(`
        <div class="tooltip-content">
          <h3>${regionName}</h3>
          <p>Belum ada website terdaftar untuk wilayah ini.</p>
        </div>
      `, { sticky: true });
    }
  };

  // Helper function to get region data by name
  const getRegionDataByName = (name: string) => {
    return regionData.find(r => r.name.toLowerCase() === name.toLowerCase());
  };

  return (
    <div className="app-container">
      <header className={`app-header ${titleVisible ? 'visible' : ''}`}>
        <h1>Dari Masyarakat untuk Kampung Halaman</h1>
      </header>
      
      <main>
        {loading ? (
          <div className="loading">Memuat peta Indonesia...</div>
        ) : (
          <div className="map-container">
            <MapContainer 
              center={[-2.5, 118]} 
              zoom={5} 
              style={{ height: '70vh', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {geoJsonData && (
                <GeoJSON 
                  data={geoJsonData} 
                  style={getStyle}
                  onEachFeature={onEachFeature}
                />
              )}
            </MapContainer>
          </div>
        )}
        
        <section className="form-section">
          <h2>Tambahkan Website Daerah</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="region">Nama Kota/Kabupaten:</label>
              <input
                type="text"
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                placeholder="Contoh: Tasikmalaya"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="website">Link Website:</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="Contoh: https://tasikgo.com"
                required
              />
            </div>
            
            <button type="submit" className="submit-button">Simpan</button>
          </form>
        </section>
      </main>
      
      <footer>
        <p>Website ini bertujuan untuk menghubungkan masyarakat dengan informasi digital dari berbagai daerah di Indonesia.</p>
        <p>Klik pada wilayah di peta untuk melihat informasi dan tautan website (jika tersedia).</p>
      </footer>
    </div>
  );
}

export default App;
