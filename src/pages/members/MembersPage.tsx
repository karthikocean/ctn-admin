import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Search, Users, Filter, User, Briefcase, MapPin, 
  FileText, Image as ImageIcon, Share2, Globe, CheckCircle2 
} from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import ActionMenu from "@/components/common/ActionMenu";
import PaginationBar from "@/components/common/PaginationBar";
import FormDrawer from "@/components/common/FormDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { mockMembers } from "@/data/mockData";

const MembersPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);

  return (
    <div className="page-container">
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Members</h1>
          </div>
        </div>

        {/* Search, Filters, Add - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search members..."
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Filters */}
          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>

          {/* Add Member */}
          <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
            onClick={() => setDrawerOpen(true)}
          >
            + Add Member
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Company</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Region</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Points</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Followers</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Following</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Expiry</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockMembers.map((m) => (
                <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">{m.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden lg:table-cell">{m.company}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{m.city}, {m.region}</td>
                  <td className="px-6 py-4 hidden sm:table-cell"><span className="text-sm font-semibold text-primary">{m.points}</span></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{m.followers}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{m.following}</td>
                  <td className="px-6 py-4"><StatusBadge status={m.status} /></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden lg:table-cell">{m.membershipExpiry}</td>
                  <td className="px-6 py-4 text-right">
                    <ActionMenu onEdit={() => setDrawerOpen(true)} onDelete={() => {}} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <PaginationBar currentPage={page} totalPages={5} onPageChange={setPage} />
        </div>
      </motion.div>

      <FormDrawer 
        open={drawerOpen} 
        onOpenChange={setDrawerOpen} 
        title="Add Member" 
        description="Complete all the details below to add a new member to the network"
      >
        <div className="pb-10">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border mb-4">
              <User size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Enter full name" className="mt-1.5" />
              </div>
              
              <div>
                <Label htmlFor="profilePhoto">Profile Photo</Label>
                <Input id="profilePhoto" type="file" className="mt-1.5 cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2 hover:file:bg-primary/20 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <span className="text-[10px] text-green-500 font-medium flex items-center gap-1"><CheckCircle2 size={10} /> Verified</span>
                  </div>
                  <Input id="mobile" placeholder="+91 00000 00000" className="mt-1.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email">Email Address</Label>
                    <span className="text-[10px] text-green-500 font-medium flex items-center gap-1"><CheckCircle2 size={10} /> Verified</span>
                  </div>
                  <Input id="email" type="email" placeholder="email@example.com" className="mt-1.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-2 pb-2 border-b border-border mb-4">
              <Briefcase size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Business Information</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <span className="text-[10px] text-amber-500 font-medium">Mandatory Verification</span>
                </div>
                <Input id="gstNumber" placeholder="Enter GST number" className="mt-1.5" />
              </div>

              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" placeholder="Enter business name" className="mt-1.5" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Business Category</Label>
                  <Select>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sub-Category</Label>
                  <Select>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="software">Software Development</SelectItem>
                      <SelectItem value="cyber">Cyber Security</SelectItem>
                      <SelectItem value="cloud">Cloud Computing</SelectItem>
                      <SelectItem value="ai">AI & Data Science</SelectItem>
                      <SelectItem value="hardware">Hardware & Networking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input id="experience" type="number" placeholder="e.g. 5" className="mt-1.5" />
                </div>
                <div>
                  <Label>Company Size</Label>
                  <Select>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 Employees</SelectItem>
                      <SelectItem value="11-50">11-50 Employees</SelectItem>
                      <SelectItem value="51-200">51-200 Employees</SelectItem>
                      <SelectItem value="201-500">201-500 Employees</SelectItem>
                      <SelectItem value="501+">501+ Employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-2 pb-2 border-b border-border mb-4">
              <MapPin size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Location Details</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Enter city" className="mt-1.5" />
              </div>
              {/* <div>
                <Label htmlFor="area">Area</Label>
                <Input id="area" placeholder="Enter area" className="mt-1.5" />
              </div> */}
            </div>
            
            <div>
              <Label htmlFor="businessAddress">Business Address</Label>
              <Textarea id="businessAddress" placeholder="Enter full address" className="mt-1.5 min-h-[80px]" />
            </div>

            <div>
              <Label htmlFor="serviceLocations">Service Locations</Label>
              <Input id="serviceLocations" placeholder="e.g. City-wide, State-wide" className="mt-1.5" />
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-2 pb-2 border-b border-border mb-4">
              <FileText size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Professional Details</h3>
            </div>
            
            <div>
              <Label htmlFor="description">Products/Services Description</Label>
              <Textarea id="description" placeholder="Describe what you offer" className="mt-1.5 min-h-[100px]" />
            </div>

            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Textarea id="targetAudience" placeholder="Who are your ideal clients?" className="mt-1.5 min-h-[80px]" />
            </div>
          </div>

          {/* Portfolio & Proof */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-2 pb-2 border-b border-border mb-4">
              <ImageIcon size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Portfolio & Proof</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="portfolio">Work Images / Portfolio</Label>
                <Input id="portfolio" type="file" multiple className="mt-1.5 cursor-pointer" />
              </div>
              <div>
                <Label htmlFor="certifications">Certifications</Label>
                <Input id="certifications" type="file" multiple className="mt-1.5 cursor-pointer" />
              </div>
              <div>
                <Label htmlFor="documents">Business Documents</Label>
                <Input id="documents" type="file" multiple className="mt-1.5 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Social & Links */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center gap-2 pb-2 border-b border-border mb-4">
              <Globe size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Social & Links</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input id="website" placeholder="https://..." className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <Input id="linkedin" placeholder="https://linkedin.com/in/..." className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="social">Instagram / Facebook</Label>
                <Input id="social" placeholder="Social media links" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="youtube">Youtube Link</Label>
                <Input id="youtube" placeholder="Youtube channel or video" className="mt-1.5" />
              </div>
            </div>
          </div>

          <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 mt-10 font-semibold shadow-lg shadow-primary/20">
            Save Member Profile
          </Button>
        </div>
      </FormDrawer>
    </div>
  );
};

export default MembersPage;
