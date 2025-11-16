import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Navigation } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

interface Device {
  id: string;
  name: string;
  imei: string;
  status: string;
  last_seen: string | null;
  created_at: string;
}

const Devices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

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
    fetchDevices();
  }, [user]);

  const fetchDevices = async () => {
    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching devices",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setDevices(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const imei = formData.get("imei") as string;

    if (editingDevice) {
      // Update existing device
      const { error } = await supabase
        .from("devices")
        .update({ name, imei })
        .eq("id", editingDevice.id);

      if (error) {
        toast({
          title: "Error updating device",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Device updated",
          description: "Device has been updated successfully.",
        });
        setDialogOpen(false);
        setEditingDevice(null);
        fetchDevices();
      }
    } else {
      // Create new device
      const { error } = await supabase.from("devices").insert({
        name,
        imei,
        user_id: user!.id,
        status: "offline",
      });

      if (error) {
        toast({
          title: "Error adding device",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Device added",
          description: "New device has been added successfully.",
        });
        setDialogOpen(false);
        fetchDevices();
      }
    }

    setLoading(false);
  };

  const handleDelete = async (deviceId: string) => {
    const { error } = await supabase.from("devices").delete().eq("id", deviceId);

    if (error) {
      toast({
        title: "Error deleting device",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Device deleted",
        description: "Device has been removed successfully.",
      });
      fetchDevices();
    }
  };

  const openEditDialog = (device: Device) => {
    setEditingDevice(device);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingDevice(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Device Management</h1>
              <p className="text-muted-foreground">
                Manage your GPS tracking devices
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingDevice(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingDevice ? "Edit Device" : "Add New Device"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDevice
                      ? "Update the device information"
                      : "Enter the details of your GPS tracking device"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Device Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Fleet Truck 01"
                      defaultValue={editingDevice?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imei">IMEI / Device ID</Label>
                    <Input
                      id="imei"
                      name="imei"
                      placeholder="e.g., 123456789012345"
                      defaultValue={editingDevice?.imei}
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeDialog}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading
                        ? "Saving..."
                        : editingDevice
                        ? "Update Device"
                        : "Add Device"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {devices.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Navigation className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Devices Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first GPS tracking device
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Device
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => (
                <Card key={device.id} className="hover:shadow-primary transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {device.imei}
                        </p>
                      </div>
                      <Badge
                        variant={
                          device.status === "online" ? "default" : "secondary"
                        }
                        className={
                          device.status === "online" ? "bg-success" : ""
                        }
                      >
                        {device.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(device)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Device</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{device.name}"? This
                              action cannot be undone and will remove all associated
                              location history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(device.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {device.last_seen && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Last seen: {new Date(device.last_seen).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Devices;
