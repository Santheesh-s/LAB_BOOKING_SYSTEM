import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Calendar, 
  Users, 
  Building2, 
  CheckCircle,
  ArrowRight,
  BookOpen,
  Shield,
  Clock,
  Sparkles,
  Cpu,
  Database,
  Network
} from 'lucide-react';

export default function Index() {
  const features = [
    {
      icon: Calendar,
      title: "Smart Lab Booking",
      description: "AI-powered scheduling for optimal resource utilization and conflict-free reservations"
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Comprehensive user management for faculty, students, and lab coordinators"
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Advanced authentication and authorization for department-wide security"
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Instant notifications and live status updates for all lab activities"
    }
  ];

  const userTypes = [
    { role: "AI Admin", description: "Complete system oversight", color: "bg-destructive", icon: Shield },
    { role: "AI Faculty", description: "Research & teaching supervision", color: "bg-primary", icon: Brain },
    { role: "Lab Coordinator", description: "Resource management", color: "bg-info", icon: Building2 },
    { role: "Research Students", description: "Project-based access", color: "bg-accent", icon: Users },
    { role: "Club Leaders", description: "Activity coordination", color: "bg-warning", icon: BookOpen },
    { role: "AI Enthusiasts", description: "Learning & exploration", color: "bg-secondary", icon: Sparkles }
  ];

  const aiLabs = [
    { name: "AI Research Lab", equipment: "High-performance GPUs, Deep Learning Workstations", icon: Cpu },
    { name: "Machine Learning Lab", equipment: "ML Frameworks, Cloud Computing Access", icon: Database },
    { name: "Computer Vision Lab", equipment: "Camera Systems, Image Processing Units", icon: Network },
    { name: "NLP & Analytics Lab", equipment: "Language Models, Text Processing Tools", icon: Brain }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">AI Department Lab System</h1>
            </div>
            <Link to="/login">
              <Button className="h-9">
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Brain className="w-3 h-3 mr-1" />
              AI Department - Lab Management
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Smart Lab Management <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                for AI Research
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Advanced laboratory booking system designed specifically for the AI Department. 
              Manage research facilities, coordinate projects, and optimize resource allocation with intelligent automation.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/login">
              <Button size="lg" className="text-base px-8">
                Access Lab System
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-base px-8">
              <BookOpen className="w-4 h-4 mr-2" />
              View Facilities
            </Button>
          </div>
        </div>
      </section>

      {/* AI Labs Showcase */}
      <section className="py-16 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              State-of-the-Art AI Laboratories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Access cutting-edge facilities equipped with the latest AI and machine learning technologies
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiLabs.map((lab, index) => {
              const Icon = lab.icon;
              return (
                <Card key={index} className="border-0 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">{lab.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-muted-foreground">
                      {lab.equipment}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Intelligent Lab Management
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced features designed for AI research environments and academic excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-0 bg-card/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-16 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Built for the AI Community
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored access controls for every member of the AI department ecosystem
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTypes.map((userType, index) => {
              const Icon = userType.icon;
              return (
                <Card key={index} className="border-0 bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg ${userType.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{userType.role}</h3>
                      <p className="text-sm text-muted-foreground">{userType.description}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-success" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="border-0 bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm shadow-xl">
            <CardContent className="p-12">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Ready to Advance AI Research?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join the AI department community and access state-of-the-art laboratory facilities for your research and learning.
              </p>
              <Link to="/login">
                <Button size="lg" className="text-base px-8">
                  Start Your Research Journey
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/80 backdrop-blur-sm border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">AI Department Lab System</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 AI Department Lab Booking System. Advancing artificial intelligence research.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
