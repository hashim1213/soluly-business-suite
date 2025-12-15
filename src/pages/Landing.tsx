import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronDown,
  Check,
  FolderKanban,
  Ticket,
  Users,
  UserCircle,
  Mail,
  DollarSign,
  FileText,
  BarChart3,
  Lightbulb,
  MessageSquare,
  Quote,
  AlertCircle,
  Sparkles,
  Mountain,
  Flag,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      sectionsRef.current.forEach((section, index) => {
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            setActiveSection(index);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: FolderKanban,
      title: "Project Management",
      description: "Organize projects with milestones, tasks, and real-time progress tracking."
    },
    {
      icon: Ticket,
      title: "Ticket System",
      description: "Track support tickets, bugs, and requests with customizable workflows."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Manage team members, roles, and permissions across your organization."
    },
    {
      icon: UserCircle,
      title: "CRM & Contacts",
      description: "Keep track of clients, contacts, and relationships in one place."
    },
    {
      icon: Mail,
      title: "Email Integration",
      description: "Connect your inbox and manage communications without leaving Soluly."
    },
    {
      icon: DollarSign,
      title: "Financial Tracking",
      description: "Monitor revenue, expenses, and profitability across all projects."
    },
    {
      icon: FileText,
      title: "Custom Forms",
      description: "Build and share forms to collect data from clients and team members."
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "Generate insights with 50+ pre-built report templates."
    },
    {
      icon: Lightbulb,
      title: "Feature Requests",
      description: "Collect and prioritize feature ideas from your customers."
    },
    {
      icon: MessageSquare,
      title: "Feedback Management",
      description: "Gather, organize, and act on customer feedback systematically."
    },
    {
      icon: Quote,
      title: "Quote Builder",
      description: "Create professional quotes and proposals for your clients."
    },
    {
      icon: AlertCircle,
      title: "Issue Tracking",
      description: "Log, track, and resolve issues before they become problems."
    }
  ];

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300",
        scrollY > 50 ? "bg-background/80 backdrop-blur-xl border-b border-border/50" : ""
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src="/logo.png" alt="Soluly" className="h-10 w-auto" />
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => sectionsRef.current[2]?.scrollIntoView({ behavior: "smooth" })}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => sectionsRef.current[4]?.scrollIntoView({ behavior: "smooth" })}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-sm font-medium">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="text-sm font-medium">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={(el) => (sectionsRef.current[0] = el)}
        className="min-h-screen relative flex flex-col items-center justify-center px-6 pt-20"
      >
        {/* Mountain Background with Parallax */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/mountain3.png"
            alt=""
            className="absolute bottom-0 left-0 right-0 w-full object-contain object-bottom opacity-50"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          />
          {/* Animated snow particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/50 rounded-full animate-snow"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 10}s`
                }}
              />
            ))}
          </div>
          {/* Gradients - softer to show more mountain */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">1 Month Free Trial - No Credit Card Required</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            Navigate your projects
            <br />
            <span className="text-primary">to the summit</span>
          </h1>

          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            The all-in-one platform to manage projects, track finances, nurture client relationships,
            and lead your team to success. Every peak starts with a single step.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            <Link to="/signup">
              <Button size="lg" className="rounded-xl px-8 h-12 text-base font-medium w-full sm:w-auto">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl px-8 h-12 text-base font-medium w-full sm:w-auto"
              onClick={() => sectionsRef.current[2]?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Features
            </Button>
          </div>

          {/* Dashboard Preview */}
          <div
            className="relative max-w-5xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-2xl" />
            <div className="relative bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-2xl">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-background/50 rounded-md px-4 py-1 text-xs text-muted-foreground">
                    app.soluly.com
                  </div>
                </div>
              </div>
              {/* Dashboard Content */}
              <div className="p-8 bg-gradient-to-br from-background to-muted/20">
                <div className="grid grid-cols-4 gap-5 mb-8">
                  {[
                    { label: "Active Projects", value: "12", icon: FolderKanban, color: "text-blue-500" },
                    { label: "Open Tickets", value: "24", icon: Ticket, color: "text-orange-500" },
                    { label: "Team Members", value: "8", icon: Users, color: "text-green-500" },
                    { label: "Revenue", value: "$48.2k", icon: DollarSign, color: "text-primary" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-background/60 backdrop-blur-sm rounded-lg p-5 border border-border/30">
                      <div className="flex items-center gap-2 mb-3">
                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                      </div>
                      <div className="text-3xl font-bold">{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-5">
                  <div className="col-span-2 bg-background/60 backdrop-blur-sm rounded-lg p-5 border border-border/30 h-40">
                    <div className="text-base font-medium mb-4">Project Progress</div>
                    <div className="space-y-3">
                      {["Website Redesign", "Mobile App", "API Integration"].map((project, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground w-32 truncate">{project}</span>
                          <div className="flex-1 bg-muted/50 rounded-full h-2.5">
                            <div
                              className="bg-primary rounded-full h-2.5 transition-all duration-1000"
                              style={{ width: `${65 + i * 15}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{65 + i * 15}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-background/60 backdrop-blur-sm rounded-lg p-5 border border-border/30 h-40">
                    <div className="text-base font-medium mb-4">Recent Activity</div>
                    <div className="space-y-3">
                      {["Task completed", "New ticket created", "Invoice sent", "Meeting scheduled"].map((activity, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          {activity}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <button
            onClick={() => sectionsRef.current[1]?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
          >
            <ChevronDown className="h-8 w-8 text-muted-foreground/60" />
          </button>
        </div>
      </section>

      {/* Journey Section - The Path */}
      <section
        ref={(el) => (sectionsRef.current[1] = el)}
        className="min-h-screen relative flex items-center px-6 py-24"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-background to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className={cn(
            "transition-all duration-1000",
            activeSection >= 1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
          )}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Mountain className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium tracking-wider">THE JOURNEY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Not every path leads
              <br />
              <span className="text-muted-foreground">straight to the top</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              Projects are expeditions. They have peaks of progress and valleys of challenges.
              Soluly embraces this reality—helping you navigate every twist and turn
              with clarity, purpose, and the right tools for the terrain.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Flag, label: "Set Goals", desc: "Define your summit" },
                { icon: Timer, label: "Track Progress", desc: "Monitor every step" },
                { icon: Mountain, label: "Reach Peaks", desc: "Celebrate wins" }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(
            "relative transition-all duration-1000 delay-300",
            activeSection >= 1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
          )}>
            {/* Journey path visualization */}
            <div className="relative aspect-square max-w-lg mx-auto">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                {/* Animated path */}
                <path
                  d="M 40,360 L 100,280 L 140,300 L 180,220 L 220,250 L 280,120 L 320,160 L 360,80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  className="text-primary/40"
                  style={{
                    strokeDashoffset: activeSection >= 1 ? 0 : 1000,
                    transition: "stroke-dashoffset 2s ease-out"
                  }}
                />
                {/* Checkpoints */}
                {[
                  { x: 40, y: 360, label: "Start" },
                  { x: 140, y: 300, label: "Plan" },
                  { x: 220, y: 250, label: "Build" },
                  { x: 280, y: 120, label: "Grow" }
                ].map((point, i) => (
                  <g key={i}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="8"
                      className={cn(
                        "transition-all duration-500",
                        activeSection >= 1 ? "fill-primary/20" : "fill-transparent"
                      )}
                      style={{ transitionDelay: `${i * 200}ms` }}
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      className={cn(
                        "transition-all duration-500",
                        activeSection >= 1 ? "fill-primary" : "fill-transparent"
                      )}
                      style={{ transitionDelay: `${i * 200}ms` }}
                    />
                    <text
                      x={point.x}
                      y={point.y + 24}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[11px] font-medium"
                    >
                      {point.label}
                    </text>
                  </g>
                ))}
                {/* Summit with flag */}
                <g className={cn(
                  "transition-all duration-700",
                  activeSection >= 1 ? "opacity-100" : "opacity-0"
                )} style={{ transitionDelay: "800ms" }}>
                  <circle cx="360" cy="80" r="12" className="fill-primary/20" />
                  <circle cx="360" cy="80" r="6" className="fill-primary" />
                  <path d="M 360,80 L 360,45 L 390,57 L 360,69" className="fill-primary" />
                  <text x="360" y="30" textAnchor="middle" className="fill-primary text-[12px] font-bold">Summit</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={(el) => (sectionsRef.current[2] = el)}
        className="py-24 px-6 relative"
      >
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/mountains.webp"
            alt=""
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full min-w-[1200px] opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className={cn(
            "text-center mb-16 transition-all duration-1000",
            activeSection >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium tracking-wider">FEATURES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Everything you need to
              <br />
              <span className="text-muted-foreground">conquer any project</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From project planning to financial tracking, Soluly provides all the tools
              your team needs to work efficiently and deliver results.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className={cn(
                  "group p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/20 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5",
                  activeSection >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${(i % 4) * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section
        ref={(el) => (sectionsRef.current[3] = el)}
        className="py-24 px-6 relative"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />
        </div>

        <div className={cn(
          "relative z-10 text-center max-w-4xl mx-auto transition-all duration-1000",
          activeSection >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        )}>
          <blockquote className="mb-12">
            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light italic leading-tight">
              "Stay hungry.
              <br />
              Stay foolish."
            </p>
            <footer className="mt-6 text-muted-foreground">
              — The spirit that drives Soluly
            </footer>
          </blockquote>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We built Soluly for teams who refuse to settle. For those who see obstacles as opportunities
            and treat every project as a chance to reach new heights.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        ref={(el) => (sectionsRef.current[4] = el)}
        className="py-24 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div className={cn(
            "text-center mb-16 transition-all duration-1000",
            activeSection >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium tracking-wider">PRICING</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start your journey with a free trial. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pro Plan */}
            <div className={cn(
              "relative rounded-2xl border-2 border-primary bg-card p-8 transition-all duration-700",
              activeSection >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-sm text-muted-foreground mb-4">For growing teams</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">$19.99</span>
                  <span className="text-muted-foreground">/user/month</span>
                </div>
                <p className="text-sm text-primary mt-2 font-medium">1 month free trial</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited projects",
                  "Full CRM & contact management",
                  "Financial tracking & reports",
                  "Custom forms builder",
                  "Email integration",
                  "50+ report templates",
                  "Team collaboration tools",
                  "Priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block">
                <Button className="w-full h-12 rounded-xl text-base font-medium">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className={cn(
              "rounded-2xl border border-border bg-card/50 p-8 transition-all duration-700 delay-100",
              activeSection >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-sm text-muted-foreground mb-4">For large organizations</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">Custom</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Contact us for pricing</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Everything in Pro",
                  "Unlimited users",
                  "Advanced security & SSO",
                  "Custom integrations",
                  "Dedicated account manager",
                  "Custom onboarding",
                  "SLA guarantee",
                  "24/7 priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                      <Check className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <a href="mailto:hashim@bytesavy.com" className="block">
                <Button variant="outline" className="w-full h-12 rounded-xl text-base font-medium">
                  Contact Sales
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        ref={(el) => (sectionsRef.current[5] = el)}
        className="py-24 px-6 relative"
      >
        <div className="absolute inset-0">
          <img
            src="/mountain2.png"
            alt=""
            className="absolute bottom-0 left-0 right-0 w-full h-[50vh] object-cover object-top opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background" />
        </div>

        <div className={cn(
          "relative z-10 text-center max-w-2xl mx-auto transition-all duration-1000",
          activeSection >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        )}>
          <img src="/logo.png" alt="Soluly" className="h-16 md:h-20 w-auto mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Ready to start your ascent?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join teams who navigate their projects with purpose, clarity, and the right tools for success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="rounded-xl px-8 h-12 text-base font-medium w-full sm:w-auto">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 text-base font-medium w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Soluly" className="h-8 w-auto" />
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Soluly. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="mailto:hashim@bytesavy.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Support
            </a>
            <a href="mailto:hashim@bytesavy.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Enterprise
            </a>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes snow {
          0% {
            transform: translateY(-10vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(20px);
            opacity: 0;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-snow {
          animation: snow linear infinite;
        }
      `}</style>
    </div>
  );
}
