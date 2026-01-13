import { useState, useEffect } from "react";
import { DollarSign, Loader2, AlertCircle, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContributionLimits, getFinancialData, ContributionLimits, CanadianFinancialData } from "@/lib/api";

interface TaxReferenceCardProps {
  compact?: boolean;
}

export function TaxReferenceCard({ compact = false }: TaxReferenceCardProps) {
  const [limits, setLimits] = useState<ContributionLimits | null>(null);
  const [financialData, setFinancialData] = useState<CanadianFinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [limitsResult, financialResult] = await Promise.all([
        getContributionLimits(),
        getFinancialData(),
      ]);
      setLimits(limitsResult);
      setFinancialData(financialResult.data);
    } catch (err) {
      console.error("Failed to fetch financial data:", err);
      setError("Failed to load tax reference data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <Card className={compact ? "border-0 shadow-none" : ""}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? "border-0 shadow-none" : ""}>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const contributionItems = limits ? [
    { label: "RRSP Limit", value: formatCurrency(limits.rrsp.limit), color: "text-blue-500" },
    { label: "TFSA Limit", value: formatCurrency(limits.tfsa.limit), color: "text-green-500" },
    { label: "FHSA Limit", value: formatCurrency(limits.fhsa.annual), color: "text-purple-500" },
    { label: "CPP Max Earnings", value: formatCurrency(limits.cpp.max_pensionable), color: "text-orange-500" },
  ] : [];

  const rateItems = financialData ? [
    { label: "Prescribed Rate", value: formatPercent(financialData.prescribed_rate_q1) },
    { label: "Cap Gains Rate", value: formatPercent(financialData.capital_gains_inclusion_rate * 100) },
    { label: "LCGE", value: formatCurrency(financialData.lifetime_capital_gains_exemption) },
  ] : [];

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {limits?.year || new Date().getFullYear()} Tax Limits
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {contributionItems.slice(0, 4).map((item) => (
            <div key={item.label} className="flex justify-between">
              <span className="text-muted-foreground">{item.label.replace(" Limit", "")}</span>
              <span className={`font-medium ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-primary" />
          {limits?.year || new Date().getFullYear()} Canadian Tax Reference
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Contribution Limits</h4>
          <div className="grid gap-2">
            {contributionItems.map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        {financialData && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Current Rates</h4>
            <div className="grid grid-cols-3 gap-3">
              {rateItems.map((item) => (
                <div key={item.label} className="text-center p-2 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-sm font-semibold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
