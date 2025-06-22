import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Package, 
  Truck, 
  Clock, 
  Shield, 
  Star, 
  Users, 
  BarChart3, 
  CheckCircle,
  ArrowRight,
  Play,
  Award,
  Globe,
  Zap,
  Building2,
  User,
  Store,
  Microscope,
  Stethoscope,
  Pill,
  FileText,
  MapPin
} from "lucide-react";

const Index = () => {
  const stats = [
    { number: "2,500+", label: "Healthcare Partners", icon: Users },
    { number: "50,000+", label: "Medical Products", icon: Package },
    { number: "99.8%", label: "On-Time Delivery", icon: Clock },
    { number: "24/7", label: "Medical Support", icon: Shield },
  ];

  const features = [
    {
      icon: Pill,
      title: "Complete Medical Catalog",
      description: "Access to verified pharmaceutical products, medical devices, and healthcare supplies from licensed suppliers.",
      color: "text-primary-600"
    },
    {
      icon: Stethoscope,
      title: "Professional Healthcare Network",
      description: "Connect patients, pharmacies, wholesalers, and labs in one integrated healthcare ecosystem.",
      color: "text-secondary-600"
    },
    {
      icon: Truck,
      title: "Advanced Logistics",
      description: "Temperature-controlled delivery, real-time tracking, and specialized medical transport services.",
      color: "text-success-600"
    },
    {
      icon: BarChart3,
      title: "Healthcare Analytics",
      description: "Comprehensive insights for inventory optimization, demand forecasting, and business intelligence.",
      color: "text-purple-600"
    },
    {
      icon: Shield,
      title: "Medical Compliance",
      description: "Full regulatory compliance, batch tracking, expiry management, and healthcare data security.",
      color: "text-blue-600"
    },
    {
      icon: Globe,
      title: "Nationwide Coverage",
      description: "Comprehensive healthcare network covering urban centers and remote areas across Tanzania.",
      color: "text-green-600"
    }
  ];

  const userTypes = [
    {
      title: "Individual Patients",
      description: "Order medicines, upload prescriptions, find nearby pharmacies",
      icon: User,
      color: "bg-blue-500",
      features: ["Prescription management", "Pharmacy finder", "Health consultations", "Order tracking"]
    },
    {
      title: "Retail Pharmacies",
      description: "Serve customers and manage inventory from wholesale suppliers",
      icon: Store,
      color: "bg-green-500",
      features: ["Customer sales", "Wholesale ordering", "Inventory management", "Business analytics"]
    },
    {
      title: "Wholesale Distributors",
      description: "Supply to retail pharmacies with bulk pricing and logistics",
      icon: Building2,
      color: "bg-purple-500",
      features: ["B2B distribution", "Bulk pricing & MOQ", "Fleet management", "Partner network"]
    },
    {
      title: "Labs & Health Centers",
      description: "Diagnostic services, appointments, and result management",
      icon: Microscope,
      color: "bg-orange-500",
      features: ["Lab tests", "Appointment booking", "Result sharing", "Health records"]
    }
  ];

  const testimonials = [
    {
      name: "Dr. Amina Hassan",
      role: "Pharmacy Owner, Dar es Salaam",
      content: "BEPAWA transformed our operations. We've reduced stockouts by 90% and improved patient satisfaction significantly.",
      rating: 5,
      type: "Retail Pharmacy"
    },
    {
      name: "John Mwangi",
      role: "Supply Chain Manager, MediCorp",
      content: "The wholesale platform streamlined our distribution to 200+ pharmacies. Outstanding logistics and tracking.",
      rating: 5,
      type: "Wholesale"
    },
    {
      name: "Sarah Kimani",
      role: "Lab Director, Arusha Diagnostics",
      content: "Patient appointment scheduling and result sharing has never been easier. Excellent integration capabilities.",
      rating: 5,
      type: "Laboratory"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-gray-50">
      {/* Header removed and is now handled globally by AppLayout */}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-medical-pattern opacity-30"></div>
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <Badge variant="secondary" className="mb-6 bg-primary-100 text-primary-800 border-primary-200">
            🏥 Complete Healthcare Ecosystem - Patients to Suppliers
          </Badge>
          
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            Tanzania's Premier
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent block mt-2">
              Healthcare Platform
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed animate-slide-up">
            Connecting patients, pharmacies, wholesalers, and laboratories in one integrated platform. 
            From prescription management to medical supply chain - we power Tanzania's healthcare future.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-slide-up">
            <Button size="lg" asChild className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 px-8 py-4 text-lg">
              <Link to="/register">
                Join Healthcare Network
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-primary-200 text-primary-700 hover:bg-primary-50 px-8 py-4 text-lg">
              <Play className="mr-2 h-5 w-5" />
              Platform Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
                  <stat.icon className="h-8 w-8 text-primary-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary-200 text-primary-700">
              Healthcare Ecosystem
            </Badge>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Built for Every Healthcare Professional
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform serves patients, pharmacies, wholesalers, and laboratories with specialized tools for each role.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userTypes.map((type, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 hover:-translate-y-2">
                <CardHeader className="pb-4">
                  <div className={`inline-flex p-3 rounded-xl ${type.color} w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <type.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed mb-4">
                    {type.description}
                  </CardDescription>
                  <div className="space-y-2">
                    {type.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-primary-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary-200 text-primary-700">
              Platform Capabilities
            </Badge>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Advanced Healthcare Technology Solutions
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From AI-powered consultations to supply chain optimization - technology that transforms healthcare delivery.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white hover:-translate-y-2">
                <CardHeader className="pb-4">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary-200 text-primary-700">
              Success Stories
            </Badge>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Trusted Across Tanzania's Healthcare Network
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how BEPAWA is transforming healthcare operations from Dar es Salaam to rural communities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white border shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-full p-3 mr-4">
                        <Users className="h-6 w-6 text-primary-700" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {testimonial.type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Award className="h-16 w-16 mx-auto mb-6 text-primary-100 animate-bounce-gentle" />
          <h3 className="text-4xl font-bold mb-6">Ready to Transform Healthcare Delivery?</h3>
          <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto leading-relaxed">
            Join thousands of healthcare professionals already using BEPAWA to improve patient care, 
            optimize operations, and grow their practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="bg-white text-primary-700 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
              <Link to="/register">
                Join Healthcare Network
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-primary-700 px-8 py-4 text-lg font-semibold transition-all duration-300"
              onClick={() => {
                alert("Healthcare demo scheduled! Our team will contact you within 24 hours.");
              }}
            >
              Schedule Healthcare Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-xl">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-semibold">BEPAWA</span>
              </div>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Tanzania's premier integrated healthcare platform connecting patients, pharmacies, wholesalers, and laboratories.
              </p>
              <div className="flex space-x-2">
                <CheckCircle className="h-5 w-5 text-success-500" />
                <span className="text-sm text-gray-300">Licensed Healthcare Platform</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-lg">For Patients</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/register" className="hover:text-white transition-colors">Find Medicines</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Upload Prescriptions</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Find Pharmacies</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Health Consultations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-lg">For Healthcare Providers</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/register" className="hover:text-white transition-colors">Pharmacy Solutions</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Wholesale Platform</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Lab Management</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Analytics Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-lg">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Healthcare Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Technical Help</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Training Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 BEPAWA Healthcare Platform. All rights reserved. 
              <span className="mx-2">•</span>
              Transforming healthcare delivery across Tanzania.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
