import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Activity, Clock } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { User, Session } from "@supabase/supabase-js";

// Mapbox access token - users will need to add this as a secret
const MAPBOX_TOKEN = "pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNseTBxZ2VndzBhOHEya3BqczdvNGthbTcifQ.placeholder"; // Placeholder

interface Device {
  id: string;
  name: string;
  imei: string;
  status: string;
  last_seen: string | null;
}

interface Location {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  direction: number;
  timestamp: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [locations, setLocations] = useState<{ [key: string]: Location }>({});
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [mapboxKey, setMapboxKey] = useState(MAPBOX_TOKEN);

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch devices
    const fetchDevices = async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching devices:", error);
      } else if (data) {
        setDevices(data);
        
        // Fetch latest location for each device
        data.forEach(async (device) => {
          const { data: locationData } = await supabase
            .from("locations")
            .select("*")
            .eq("device_id", device.id)
            .order("timestamp", { ascending: false })
            .limit(1)
            .single();

          if (locationData) {
            setLocations((prev) => ({
              ...prev,
              [device.id]: locationData,
            }));
          }
        });
      }
    };

    fetchDevices();

    // Subscribe to realtime updates for locations
    const channel = supabase
      .channel("locations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "locations",
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const newLocation = payload.new as Location;
            setLocations((prev) => ({
              ...prev,
              [newLocation.device_id]: newLocation,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    mapboxgl.accessToken = mapboxKey;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-98.5795, 39.8283], // Center of USA
        zoom: 4,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [mapboxKey]);

  useEffect(() => {
    if (!map.current) return;

    // Update markers for devices
    Object.entries(locations).forEach(([deviceId, location]) => {
      const device = devices.find((d) => d.id === deviceId);
      if (!device) return;

      // Remove old marker if exists
      if (markers.current[deviceId]) {
        markers.current[deviceId].remove();
      }

      // Create marker element
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor =
        device.status === "online" ? "#10b981" : "#6b7280";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">${device.name}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Speed: ${location.speed?.toFixed(1) || 0} km/h</p>
          <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Direction: ${location.direction}°</p>
          <p style="font-size: 12px; color: #666;">Status: ${device.status}</p>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current[deviceId] = marker;

      // Fly to marker if it's the first one or selected
      if (
        Object.keys(markers.current).length === 1 ||
        deviceId === selectedDevice
      ) {
        map.current!.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 12,
        });
      }
    });
  }, [locations, devices, selectedDevice]);

  const handleDeviceClick = (deviceId: string) => {
    setSelectedDevice(deviceId);
    const location = locations[deviceId];
    if (location && map.current) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 14,
      });
      markers.current[deviceId]?.togglePopup();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 p-6">
        <div className="container mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Live Tracking Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your devices in real-time
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  <div className="relative">
                    {mapboxKey === MAPBOX_TOKEN && (
                      <div className="absolute top-4 left-4 right-4 z-10 bg-yellow-500/90 text-yellow-950 p-4 rounded-lg shadow-lg">
                        <p className="font-semibold mb-2">
                          Mapbox Token Required
                        </p>
                        <p className="text-sm mb-3">
                          Enter your Mapbox public token to enable the map
                        </p>
                        <Input
                          placeholder="pk.eyJ1..."
                          value={mapboxKey}
                          onChange={(e) => setMapboxKey(e.target.value)}
                          className="bg-white"
                        />
                      </div>
                    )}
                    <div
                      ref={mapContainer}
                      className="w-full h-[600px] rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Device List */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Active Devices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {devices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Navigation className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No devices added yet</p>
                      <Button
                        variant="link"
                        onClick={() => navigate("/devices")}
                        className="mt-2"
                      >
                        Add your first device
                      </Button>
                    </div>
                  ) : (
                    devices.map((device) => {
                      const location = locations[device.id];
                      return (
                        <Card
                          key={device.id}
                          className={`cursor-pointer transition-all hover:shadow-primary ${
                            selectedDevice === device.id
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                          onClick={() => handleDeviceClick(device.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold">{device.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {device.imei}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  device.status === "online"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  device.status === "online"
                                    ? "bg-success"
                                    : ""
                                }
                              >
                                {device.status}
                              </Badge>
                            </div>

                            {location && (
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>
                                    {location.latitude.toFixed(6)},{" "}
                                    {location.longitude.toFixed(6)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Activity className="h-3 w-3" />
                                  <span>{location.speed?.toFixed(1)} km/h</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTimestamp(location.timestamp)}</span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
