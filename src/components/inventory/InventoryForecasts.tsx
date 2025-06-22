import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { inventoryForecastService, InventoryForecast } from "@/services/inventoryForecastService";
import { inventoryService, Product } from "@/services/inventoryService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { User } from "@/contexts/AuthContext";

interface InventoryForecastsProps {
  user: User;
}

export function InventoryForecasts({ user }: InventoryForecastsProps) {
  const [forecasts, setForecasts] = useState<InventoryForecast[]>([]);
  const [filteredForecasts, setFilteredForecasts] = useState<InventoryForecast[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [showChart, setShowChart] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadForecasts();
    loadProducts();
  }, [user]);

  useEffect(() => {
    filterForecasts();
  }, [forecasts, selectedProduct, dateRange]);

  const loadForecasts = async () => {
    try {
      const data = await inventoryForecastService.fetchForecasts();
      setForecasts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load forecasts",
        variant: "destructive",
      });
    }
  };

  const loadProducts = async () => {
    if (!user) return;
    try {
      const userProducts = await inventoryService.getProductsByRole(user.id, user.role);
      setProducts(userProducts);
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to load products for forecasting.",
        variant: "destructive",
      });
    }
  };

  const filterForecasts = () => {
    let filtered = [...forecasts];

    if (selectedProduct) {
      filtered = filtered.filter((f) => f.product_id === selectedProduct);
    }

    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter((f) => {
        const forecastDate = new Date(f.forecast_date);
        return forecastDate >= dateRange.from && forecastDate <= dateRange.to;
      });
    }

    setFilteredForecasts(filtered);
  };

  const getChartData = () => {
    return filteredForecasts.map((f) => ({
      date: format(new Date(f.forecast_date), "MMM d"),
      forecast: f.forecasted_demand,
      actual: f.actual || 0,
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Forecasts</CardTitle>
          <div className="flex flex-wrap items-center gap-4">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setSelectedProduct("")} disabled={!selectedProduct}>Clear</Button>
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            <Button
              variant="outline"
              onClick={() => setShowChart(!showChart)}
            >
              {showChart ? "Hide Chart" : "Show Chart"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showChart && (
            <div className="h-[300px] mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#8884d8"
                    name="Forecast"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#82ca9d"
                    name="Actual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Forecasted Demand</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Accuracy %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredForecasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No forecast data available for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredForecasts.map((forecast) => {
                  const accuracy = forecast.actual
                    ? (100 - Math.abs((forecast.forecasted_demand - forecast.actual) / forecast.actual) * 100).toFixed(1)
                    : "-";
                  const product = products.find((p) => p.id === forecast.product_id);
                  return (
                    <TableRow key={forecast.id}>
                      <TableCell>
                        {format(new Date(forecast.forecast_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {product?.name || forecast.product_id}
                      </TableCell>
                      <TableCell className="text-right">{forecast.forecasted_demand}</TableCell>
                      <TableCell className="text-right">{forecast.actual || "-"}</TableCell>
                      <TableCell className="text-right">{accuracy}%</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 