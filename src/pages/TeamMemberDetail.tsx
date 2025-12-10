import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Building,
  CreditCard,
  Briefcase,
  Edit,
  FileText,
  TrendingUp,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// Mock team member data
const teamMembersData: Record<string, {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  hourlyRate: number;
  salary: number;
  contractType: string;
  status: string;
  avatar: string;
  startDate: string;
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentInfo: {
    method: string;
    details: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
}> = {
  "1": {
    id: "1",
    name: "You",
    email: "you@company.com",
    phone: "+1 555-0100",
    role: "Project Lead",
    department: "Management",
    hourlyRate: 150,
    salary: 120000,
    contractType: "Full-time",
    status: "active",
    avatar: "Y",
    startDate: "Jan 15, 2020",
    location: {
      address: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      country: "USA",
    },
    paymentInfo: {
      method: "Direct Deposit",
      details: "Bank of America - ****4521",
    },
    emergencyContact: {
      name: "Jane Doe",
      phone: "+1 555-0199",
      relation: "Spouse",
    },
  },
  "2": {
    id: "2",
    name: "Sarah Chen",
    email: "sarah@company.com",
    phone: "+1 555-0101",
    role: "Senior Developer",
    department: "Engineering",
    hourlyRate: 95,
    salary: 95000,
    contractType: "Full-time",
    status: "active",
    avatar: "SC",
    startDate: "Mar 10, 2021",
    location: {
      address: "456 Oak Avenue",
      city: "Oakland",
      state: "CA",
      zip: "94612",
      country: "USA",
    },
    paymentInfo: {
      method: "Direct Deposit",
      details: "Chase Bank - ****7823",
    },
    emergencyContact: {
      name: "Michael Chen",
      phone: "+1 555-0188",
      relation: "Brother",
    },
  },
  "3": {
    id: "3",
    name: "Mike Johnson",
    email: "mike@company.com",
    phone: "+1 555-0102",
    role: "Designer",
    department: "Design",
    hourlyRate: 85,
    salary: 0,
    contractType: "Contractor",
    status: "active",
    avatar: "MJ",
    startDate: "Jun 1, 2022",
    location: {
      address: "789 Creative Blvd",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      country: "USA",
    },
    paymentInfo: {
      method: "E-Transfer",
      details: "mike.johnson@email.com",
    },
    emergencyContact: {
      name: "Lisa Johnson",
      phone: "+1 555-0177",
      relation: "Wife",
    },
  },
  "4": {
    id: "4",
    name: "Emma Wilson",
    email: "emma@company.com",
    phone: "+1 555-0103",
    role: "Developer",
    department: "Engineering",
    hourlyRate: 90,
    salary: 90000,
    contractType: "Full-time",
    status: "active",
    avatar: "EW",
    startDate: "Sep 15, 2021",
    location: {
      address: "321 Tech Park Drive",
      city: "San Jose",
      state: "CA",
      zip: "95134",
      country: "USA",
    },
    paymentInfo: {
      method: "Direct Deposit",
      details: "Wells Fargo - ****9012",
    },
    emergencyContact: {
      name: "Tom Wilson",
      phone: "+1 555-0166",
      relation: "Father",
    },
  },
  "5": {
    id: "5",
    name: "David Brown",
    email: "david@company.com",
    phone: "+1 555-0104",
    role: "QA Engineer",
    department: "Quality",
    hourlyRate: 75,
    salary: 75000,
    contractType: "Full-time",
    status: "active",
    avatar: "DB",
    startDate: "Feb 1, 2023",
    location: {
      address: "567 Quality Lane",
      city: "Palo Alto",
      state: "CA",
      zip: "94301",
      country: "USA",
    },
    paymentInfo: {
      method: "Direct Deposit",
      details: "Citibank - ****3456",
    },
    emergencyContact: {
      name: "Sarah Brown",
      phone: "+1 555-0155",
      relation: "Spouse",
    },
  },
  "6": {
    id: "6",
    name: "Lisa Park",
    email: "lisa@company.com",
    phone: "+1 555-0105",
    role: "Business Analyst",
    department: "Operations",
    hourlyRate: 80,
    salary: 80000,
    contractType: "Full-time",
    status: "active",
    avatar: "LP",
    startDate: "Nov 10, 2022",
    location: {
      address: "890 Business Center",
      city: "Mountain View",
      state: "CA",
      zip: "94043",
      country: "USA",
    },
    paymentInfo: {
      method: "Direct Deposit",
      details: "US Bank - ****7890",
    },
    emergencyContact: {
      name: "Kevin Park",
      phone: "+1 555-0144",
      relation: "Brother",
    },
  },
  "7": {
    id: "7",
    name: "James Lee",
    email: "james@company.com",
    phone: "+1 555-0106",
    role: "DevOps Engineer",
    department: "Engineering",
    hourlyRate: 100,
    salary: 100000,
    contractType: "Full-time",
    status: "active",
    avatar: "JL",
    startDate: "Aug 5, 2020",
    location: {
      address: "234 Cloud Street",
      city: "Sunnyvale",
      state: "CA",
      zip: "94086",
      country: "USA",
    },
    paymentInfo: {
      method: "Direct Deposit",
      details: "First Republic - ****2345",
    },
    emergencyContact: {
      name: "Mary Lee",
      phone: "+1 555-0133",
      relation: "Mother",
    },
  },
  "8": {
    id: "8",
    name: "Anna Martinez",
    email: "anna@company.com",
    phone: "+1 555-0107",
    role: "UI Designer",
    department: "Design",
    hourlyRate: 80,
    salary: 0,
    contractType: "Contractor",
    status: "inactive",
    avatar: "AM",
    startDate: "Apr 20, 2023",
    location: {
      address: "456 Design Plaza",
      city: "San Diego",
      state: "CA",
      zip: "92101",
      country: "USA",
    },
    paymentInfo: {
      method: "E-Transfer",
      details: "anna.martinez@email.com",
    },
    emergencyContact: {
      name: "Carlos Martinez",
      phone: "+1 555-0122",
      relation: "Husband",
    },
  },
};

// Mock time entries for this member
const timeEntriesData = [
  { id: "1", date: "Dec 9, 2024", project: "Acme Corp", projectId: "PRJ-001", hours: 8, description: "Feature development", billable: true },
  { id: "2", date: "Dec 8, 2024", project: "Acme Corp", projectId: "PRJ-001", hours: 7, description: "Code review", billable: true },
  { id: "3", date: "Dec 7, 2024", project: "TechStart Inc", projectId: "PRJ-002", hours: 6, description: "UI implementation", billable: true },
  { id: "4", date: "Dec 6, 2024", project: "Acme Corp", projectId: "PRJ-001", hours: 8, description: "Bug fixes", billable: true },
  { id: "5", date: "Dec 5, 2024", project: "Internal", projectId: "", hours: 2, description: "Team meeting", billable: false },
  { id: "6", date: "Dec 4, 2024", project: "CloudNine Systems", projectId: "PRJ-005", hours: 5, description: "API integration", billable: true },
  { id: "7", date: "Dec 3, 2024", project: "Acme Corp", projectId: "PRJ-001", hours: 8, description: "Sprint planning", billable: true },
  { id: "8", date: "Dec 2, 2024", project: "TechStart Inc", projectId: "PRJ-002", hours: 4, description: "Design review", billable: true },
];

// Mock payment history
const paymentHistoryData = [
  { id: "1", date: "Dec 1, 2024", amount: 4500, period: "Nov 16-30, 2024", status: "paid", method: "Direct Deposit" },
  { id: "2", date: "Nov 15, 2024", amount: 4800, period: "Nov 1-15, 2024", status: "paid", method: "Direct Deposit" },
  { id: "3", date: "Nov 1, 2024", amount: 4200, period: "Oct 16-31, 2024", status: "paid", method: "Direct Deposit" },
  { id: "4", date: "Oct 15, 2024", amount: 4650, period: "Oct 1-15, 2024", status: "paid", method: "Direct Deposit" },
];

// Mock project breakdown
const projectBreakdownData = [
  { projectId: "PRJ-001", projectName: "Acme Corp", totalHours: 120, percentage: 45 },
  { projectId: "PRJ-002", projectName: "TechStart Inc", totalHours: 60, percentage: 23 },
  { projectId: "PRJ-005", projectName: "CloudNine Systems", totalHours: 45, percentage: 17 },
  { projectId: "PRJ-003", projectName: "Global Solutions", totalHours: 25, percentage: 10 },
  { projectId: "", projectName: "Internal/Non-billable", totalHours: 14, percentage: 5 },
];

export default function TeamMemberDetail() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [timeEntries, setTimeEntries] = useState(timeEntriesData);
  const [paymentHistory] = useState(paymentHistoryData);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const member = teamMembersData[memberId || ""] || teamMembersData["2"]; // Default to Sarah for demo

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-bold mb-2">Team Member Not Found</h2>
        <Button onClick={() => navigate("/team")}>Back to Team</Button>
      </div>
    );
  }

  // Calculate stats
  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
  const billableHours = timeEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0);
  const totalEarned = billableHours * member.hourlyRate;
  const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  const unpaidAmount = totalEarned - totalPaid;

  // Calculate tenure
  const startDate = new Date(member.startDate);
  const now = new Date();
  const tenureMonths = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const tenureYears = Math.floor(tenureMonths / 12);
  const remainingMonths = tenureMonths % 12;
  const tenureText = tenureYears > 0 ? `${tenureYears}y ${remainingMonths}m` : `${remainingMonths}m`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/team")} className="border-2 border-transparent hover:border-border">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">{member.avatar}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{member.name}</h1>
              <Badge className={member.status === "active" ? "bg-chart-2 text-background" : "bg-muted text-muted-foreground"}>
                {member.status}
              </Badge>
              <Badge variant={member.contractType === "Full-time" ? "default" : "secondary"} className="border-2 border-border">
                {member.contractType}
              </Badge>
            </div>
            <p className="text-muted-foreground">{member.role} • {member.department}</p>
          </div>
        </div>
        <Button className="border-2" onClick={() => setIsEditDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-1">
                <Clock className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">{totalHours}h</div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <DollarSign className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono">${totalPaid.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Paid</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 border-2 border-border flex items-center justify-center ${unpaidAmount > 0 ? "bg-chart-4" : "bg-muted"}`}>
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className={`text-2xl font-bold font-mono ${unpaidAmount > 0 ? "text-chart-4" : ""}`}>
                  ${unpaidAmount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Unpaid</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-primary">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{tenureText}</div>
                <div className="text-sm text-muted-foreground">Tenure</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="border-2 border-border p-1 bg-background">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="hours" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Time Entries
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Payments
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Projects
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact Info */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <div>{member.location.address}</div>
                    <div>{member.location.city}, {member.location.state} {member.location.zip}</div>
                    <div>{member.location.country}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-mono font-bold">${member.hourlyRate}/hr</span>
                </div>
                {member.salary > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Salary</span>
                    <span className="font-mono font-bold">${member.salary.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t-2 border-border pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Payment Method</span>
                    <Badge variant="secondary" className="border-2 border-border">{member.paymentInfo.method}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{member.paymentInfo.details}</div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Info */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">{member.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenure</span>
                  <span className="font-medium">{tenureText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{member.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Type</span>
                  <Badge variant={member.contractType === "Full-time" ? "default" : "secondary"} className="border-2 border-border">
                    {member.contractType}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="border-b-2 border-border">
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{member.emergencyContact.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Relationship</span>
                  <span className="font-medium">{member.emergencyContact.relation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{member.emergencyContact.phone}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Time Entries Tab */}
        <TabsContent value="hours" className="space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Time Entries</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {billableHours} billable hours • {totalHours - billableHours} non-billable
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 hover:bg-transparent">
                    <TableHead className="font-bold uppercase text-xs">Date</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Project</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Description</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Hours</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id} className="border-b-2">
                      <TableCell className="text-muted-foreground">{entry.date}</TableCell>
                      <TableCell>
                        {entry.projectId ? (
                          <Link to={`/projects/${entry.projectId}`} className="text-primary hover:underline">
                            {entry.project}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{entry.project}</span>
                        )}
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{entry.hours}h</TableCell>
                      <TableCell>
                        {entry.billable ? (
                          <Badge className="bg-chart-2 text-background">Billable</Badge>
                        ) : (
                          <Badge variant="secondary" className="border-2 border-border">Non-billable</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Earned</div>
                <div className="text-2xl font-bold font-mono">${totalEarned.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Paid</div>
                <div className="text-2xl font-bold font-mono text-chart-2">${totalPaid.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border shadow-sm">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Outstanding</div>
                <div className={`text-2xl font-bold font-mono ${unpaidAmount > 0 ? "text-chart-4" : "text-chart-2"}`}>
                  ${unpaidAmount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 hover:bg-transparent">
                    <TableHead className="font-bold uppercase text-xs">Date</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Period</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Method</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Amount</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id} className="border-b-2">
                      <TableCell className="font-medium">{payment.date}</TableCell>
                      <TableCell className="text-muted-foreground">{payment.period}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell className="text-right font-mono font-bold">${payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className="bg-chart-2 text-background">{payment.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Project Hours Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {projectBreakdownData.map((project) => (
                <div key={project.projectId || "internal"} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    {project.projectId ? (
                      <Link to={`/projects/${project.projectId}`} className="text-primary hover:underline font-medium">
                        {project.projectName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{project.projectName}</span>
                    )}
                    <span className="font-mono font-bold">{project.totalHours}h ({project.percentage}%)</span>
                  </div>
                  <Progress value={project.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="border-b-2 border-border">
              <CardTitle>Active Projects</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 hover:bg-transparent">
                    <TableHead className="font-bold uppercase text-xs">Project</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Hours</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Earnings</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectBreakdownData.filter(p => p.projectId).map((project) => (
                    <TableRow key={project.projectId} className="border-b-2">
                      <TableCell>
                        <Link to={`/projects/${project.projectId}`} className="font-medium text-primary hover:underline">
                          {project.projectName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono">{project.totalHours}h</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        ${(project.totalHours * member.hourlyRate).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Link to={`/projects/${project.projectId}`}>
                          <Button variant="ghost" size="sm" className="border-2 border-transparent hover:border-border">
                            View Project
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-2 sm:max-w-[500px]">
          <DialogHeader className="border-b-2 border-border pb-4">
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input defaultValue={member.name} className="border-2" />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" defaultValue={member.email} className="border-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input defaultValue={member.phone} className="border-2" />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Input defaultValue={member.role} className="border-2" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input defaultValue={member.location.address} className="border-2" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>City</Label>
                <Input defaultValue={member.location.city} className="border-2" />
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input defaultValue={member.location.state} className="border-2" />
              </div>
              <div className="grid gap-2">
                <Label>ZIP</Label>
                <Input defaultValue={member.location.zip} className="border-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Payment Method</Label>
                <Select defaultValue={member.paymentInfo.method}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="Direct Deposit">Direct Deposit</SelectItem>
                    <SelectItem value="E-Transfer">E-Transfer</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Payment Details</Label>
                <Input defaultValue={member.paymentInfo.details} className="border-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Hourly Rate ($)</Label>
                <Input type="number" defaultValue={member.hourlyRate} className="border-2" />
              </div>
              <div className="grid gap-2">
                <Label>Annual Salary ($)</Label>
                <Input type="number" defaultValue={member.salary} className="border-2" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t-2 border-border pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-2">
              Cancel
            </Button>
            <Button onClick={() => { setIsEditDialogOpen(false); toast.success("Profile updated"); }} className="border-2">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
