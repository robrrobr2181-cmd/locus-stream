import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Download, MapPin, Activity, Clock } from "lucide-react";
import { format } from "date-fns";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { User, Session } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNseTBxZ2VndzBhOHEya3BqczdvNGthbTcifQ.placeholder";

interface Device {
  id: string;
  name: string;
  imei: string;
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

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

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

    const fetchDevices = async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("id, name, imei")
        .order("name");

      if (error) {
        console.error("Error fetching devices:", error);
      } else if (data) {
        setDevices(data);
      }
    };

    fetchDevices();
  }, [user]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-98.5795, 39.8283],
        zoom: 4,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, []);

  useEffect(() => {
    if (!map.current || locations.length === 0) return;

    // Clear existing route
    if (map.current.getSource("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }

    // Create route line
    const coordinates = locations.map((loc) => [loc.longitude, loc.latitude]);

    map.current.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    });

    map.current.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3b82f6",
        "line-width": 4,
      },
    });

    // Add markers for start and end
    const startMarker = document.createElement("div");
    startMarker.style.width = "20px";
    startMarker.style.height = "20px";
    startMarker.style.borderRadius = "50%";
    startMarker.style.backgroundColor = "#10b981";
    startMarker.style.border = "2px solid white";

    new mapboxgl.Marker(startMarker)
      .setLngLat(coordinates[0] as [number, number])
      .setPopup(
        new mapboxgl.Popup().setHTML(
          `<div style="padding: 8px;"><strong>Start</strong></div>`
        )
      )
      .addTo(map.current);

    const endMarker = document.createElement("div");
    endMarker.style.width = "20px";
    endMarker.style.height = "20px";
    endMarker.style.borderRadius = "50%";
    endMarker.style.backgroundColor = "#ef4444";
    endMarker.style.border = "2px solid white";

    new mapboxgl.Marker(endMarker)
      .setLngLat(coordinates[coordinates.length - 1] as [number, number])
      .setPopup(
        new mapboxgl.Popup().setHTML(
          `<div style="padding: 8px;"><strong>End</strong></div>`
        )
      )
      .addTo(map.current);

    // Fit bounds to show entire route
    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
    map.current.fitBounds(bounds, { padding: 50 });
  }, [locations]);

  const fetchHistory = async () => {
    if (!selectedDevice || !startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please select a device and date range",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("device_id", selectedDevice)
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString())
      .order("timestamp", { ascending: true });

    if (error) {
      toast({
        title: "Error fetching history",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setLocations(data);
      if (data.length === 0) {
        toast({
          title: "No data found",
          description: "No location data found for the selected period",
        });
      }
    }

    setLoading(false);
  };

  const exportToCSV = () => {
    if (locations.length === 0) return;

    const device = devices.find((d) => d.id === selectedDevice);
    const headers = ["Timestamp", "Latitude", "Longitude", "Speed (km/h)", "Direction"];
    const rows = locations.map((loc) => [
      new Date(loc.timestamp).toISOString(),
      loc.latitude,
      loc.longitude,
      loc.speed,
      loc.direction,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${device?.name || "device"}_history_${format(
      startDate!,
      "yyyy-MM-dd"
    )}_to_${format(endDate!, "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "History has been exported to CSV",
    });
  };

  const calculateStats = () => {
    if (locations.length === 0)
      return { totalDistance: 0, maxSpeed: 0, avgSpeed: 0, duration: 0 };

    const speeds = locations.map((loc) => loc.speed || 0);
    const maxSpeed = Math.max(...speeds);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

    const startTime = new Date(locations[0].timestamp).getTime();
    const endTime = new Date(locations[locations.length - 1].timestamp).getTime();
    const duration = (endTime - startTime) / (1000 * 60 * 60); // hours

    return { maxSpeed, avgSpeed, duration };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 p-6">
        <div className="container mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Route History</h1>
            <p className="text-muted-foreground">
              View and analyze past GPS tracking data
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Device</Label>
                  <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a device" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button onClick={fetchHistory} disabled={loading} className="w-full">
                  {loading ? "Loading..." : "Load History"}
                </Button>

                {locations.length > 0 && (
                  <Button
                    onClick={exportToCSV}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to CSV
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Map and Stats */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-0">
                  <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />
                </CardContent>
              </Card>

              {locations.length > 0 && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Max Speed</p>
                          <p className="text-2xl font-bold">
                            {stats.maxSpeed.toFixed(1)} km/h
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Speed</p>
                          <p className="text-2xl font-bold">
                            {stats.avgSpeed.toFixed(1)} km/h
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="text-2xl font-bold">
                            {stats.duration.toFixed(1)}h
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
