import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Navigation,
  MapPin,
  Activity,
  Shield,
  Zap,
  Globe,
  Clock,
  Bell,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import heroImage from "@/assets/hero-gps.jpg";

const Index = () => {
  const features = [
    {
      icon: MapPin,
      title: "Real-Time Tracking",
      description:
        "Track your devices live on an interactive map with sub-second updates.",
    },
    {
      icon: Activity,
      title: "Route History",
      description:
        "Review complete journey history with speed, direction, and timestamps.",
    },
    {
      icon: Shield,
      title: "Geo-Fencing",
      description:
        "Set up virtual boundaries and get instant alerts when devices cross them.",
    },
    {
      icon: Zap,
      title: "Speed Alerts",
      description:
        "Receive notifications when devices exceed predefined speed limits.",
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description:
        "Track devices anywhere in the world with reliable GPS connectivity.",
    },
    {
      icon: Clock,
      title: "24/7 Monitoring",
      description:
        "Round-the-clock tracking with automatic status updates and alerts.",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Add Your Devices",
      description:
        "Register your GPS devices with unique IMEI numbers in seconds.",
    },
    {
      step: "2",
      title: "Start Tracking",
      description:
        "View real-time locations on an interactive map with live updates.",
    },
    {
      step: "3",
      title: "Monitor & Analyze",
      description:
        "Get insights, alerts, and detailed history for better decision making.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <Activity className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">
                  Live GPS Tracking Platform
                </span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Track Your Fleet in{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Real-Time
                </span>
              </h1>

              <p className="text-xl text-muted-foreground">
                Professional GPS tracking solution for vehicles, assets, and teams.
                Monitor locations, analyze routes, and stay connected 24/7.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="shadow-primary">
                  <Link to="/auth">Start Tracking Now</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth">View Demo</Link>
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    &lt;1s
                  </div>
                  <div className="text-sm text-muted-foreground">Latency</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
              <img
                src={heroImage}
                alt="GPS Tracking Dashboard"
                className="relative rounded-2xl shadow-2xl border border-border/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage and monitor your GPS fleet effectively
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-primary"
              >
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold">How GPS Tracking Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started with TrackPro in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-glow">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero border-y border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold">
              Ready to Start Tracking?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of businesses using TrackPro for real-time GPS
              tracking and fleet management.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="shadow-primary">
                <Link to="/auth">Get Started Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Schedule Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">TrackPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 TrackPro. Professional GPS Tracking Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
