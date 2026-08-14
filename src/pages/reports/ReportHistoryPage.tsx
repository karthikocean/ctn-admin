import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getReportedHistory } from "@/api/ReportedHistoryApi";
import { format } from "date-fns";
import PaginationBar from "@/components/common/PaginationBar";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
const ReportHistoryPage = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);
    const [totalReports, setTotalReports] = useState(0);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await getReportedHistory({ page, limit });
            setReports(response.data || []);
            setTotalPages(response.totalPages || 1);
            setTotalReports(response.total || response.totalItems || 0);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [page]);

    return (
        <div className="page-container relative min-h-[600px]">
            {loading && reports.length === 0 && (
                <GlobalNetworkLoader
                    fullScreen={false}
                    title="Fetching Report History..."
                    subtitle="Analyzing reported activity logs"
                />
            )}

            {/* Single Row Header */}
            <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
                {/* Title Block */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <History size={16} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-foreground">Report History</h1>
                    </div>
                </div>

                {/* Search, Filters, Export - aligned right on same row */}
                <div className="flex items-center gap-2 ml-auto">
                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                        />
                    </div>

                    {/* Filters */}
                    <Select defaultValue="all">
                        <SelectTrigger className="h-9 w-32 rounded-lg text-xs bg-background border-border">
                            <Filter size={14} className="mr-1.5" />
                            <SelectValue placeholder="All Modules" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Modules</SelectItem>
                            <SelectItem value="events">Events</SelectItem>
                            <SelectItem value="members">Members</SelectItem>
                            <SelectItem value="posts">Posts</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-secondary/50">
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reporter Name</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Name</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Module Name</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {reports.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground">
                                        No reported history found
                                    </td>
                                </tr>
                            ) : (
                                reports.map((item, index) => (
                                    <tr key={item._id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-foreground font-semibold">{(page * limit) + index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-foreground font-semibold">{item.reporterName}</span>
                                                <span className="text-xs text-foreground font-semibold">{item.reporterMobile}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-foreground font-semibold">{item.targetName}</span>
                                                <span className="text-xs text-foreground font-semibold">{item.targetMobile}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground font-semibold">
                                            <span className="px-2 py-1 rounded-md bg-primary/5 text-primary text-[11px] font-bold uppercase tracking-wider">
                                                {item.moduleName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground font-semibold">{item.reason}</td>
                                        <td className="px-6 py-4 text-sm text-foreground text-right font-semibold">
                                            {item.createdAt ? format(new Date(item.createdAt), "dd MMM yyyy") : "N/A"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && reports.length > 0 && (
                    <div className="px-6 pb-4">
                        <PaginationBar
                            currentPage={page + 1}
                            totalPages={totalPages}
                            totalItems={totalReports}
                            onPageChange={(p) => setPage(p - 1)}
                        />
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ReportHistoryPage;
