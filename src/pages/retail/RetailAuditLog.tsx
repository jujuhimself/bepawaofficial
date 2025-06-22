import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { auditService } from '../../services/auditService';
import { 
  Eye, 
  Calendar, 
  User, 
  Database, 
  Search, 
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

const RetailAuditLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterTable, setFilterTable] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchAuditLogs();
    }
  }, [user]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const entries = await auditService.getAuditLogs();
      setAuditEntries(entries);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredEntries = () => {
    return auditEntries.filter(entry => {
      const searchMatch = !searchTerm || 
        entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.record_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const actionMatch = filterAction === 'all' || entry.action === filterAction;
      const tableMatch = filterTable === 'all' || entry.table_name === filterTable;
      
      const dateMatch = (!dateFrom || new Date(entry.created_at) >= new Date(dateFrom)) &&
                       (!dateTo || new Date(entry.created_at) <= new Date(dateTo));

      return searchMatch && actionMatch && tableMatch && dateMatch;
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'UPDATE':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'DELETE':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'LOGIN':
        return <User className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUniqueActions = () => {
    const actions = [...new Set(auditEntries.map(entry => entry.action))];
    return actions.sort();
  };

  const getUniqueTables = () => {
    const tables = [...new Set(auditEntries.map(entry => entry.table_name).filter(Boolean))];
    return tables.sort();
  };

  const formatAuditData = (data: any) => {
    if (!data) return 'N/A';
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div>Loading audit logs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Audit Log"
          description="Track all system activities and changes"
          badge={{ text: "Retail Portal", variant: "outline" }}
        />

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search actions, tables, or IDs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="action">Action</Label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {getUniqueActions().map(action => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="table">Table</Label>
                <Select value={filterTable} onValueChange={setFilterTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {getUniqueTables().map(table => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Audit Entries */}
        <div className="space-y-4">
          {getFilteredEntries().length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No audit entries found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterAction !== 'all' || filterTable !== 'all' || dateFrom || dateTo 
                    ? 'Try adjusting your filters' 
                    : 'No audit entries have been recorded yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            getFilteredEntries().map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {getActionIcon(entry.action)}
                      <div>
                        <h3 className="text-lg font-semibold">
                          {entry.action}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {entry.table_name && `Table: ${entry.table_name}`}
                          {entry.record_id && ` | Record ID: ${entry.record_id}`}
                        </p>
                      </div>
                    </div>
                    <Badge className={getActionColor(entry.action)}>
                      {entry.action}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span>{entry.user_id}</span>
                    </div>
                  </div>

                  {(entry.old_values || entry.new_values) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Changes</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        {entry.old_values && (
                          <div>
                            <Label className="text-xs text-gray-500">Previous Values</Label>
                            <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                              {formatAuditData(entry.old_values)}
                            </pre>
                          </div>
                        )}
                        {entry.new_values && (
                          <div>
                            <Label className="text-xs text-gray-500">New Values</Label>
                            <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                              {formatAuditData(entry.new_values)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {entry.ip_address && (
                    <div className="mt-4 text-sm text-gray-600">
                      <span className="font-medium">IP Address:</span> {entry.ip_address}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {auditEntries.length}
                </div>
                <div className="text-sm text-gray-600">Total Entries</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {auditEntries.filter(e => e.action === 'CREATE').length}
                </div>
                <div className="text-sm text-gray-600">Creates</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {auditEntries.filter(e => e.action === 'UPDATE').length}
                </div>
                <div className="text-sm text-gray-600">Updates</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {auditEntries.filter(e => e.action === 'DELETE').length}
                </div>
                <div className="text-sm text-gray-600">Deletes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RetailAuditLog;
