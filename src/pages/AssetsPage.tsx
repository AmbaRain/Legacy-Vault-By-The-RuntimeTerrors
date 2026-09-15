import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TokenIcon } from '../components/ui/TokenIcon';
import {
  assetToUsd,
  formatAssetAmount,
  formatUsd,
  getAssetConfig,
} from '../utils/format';

export const AssetsPage: React.FC = () => {
  const { vault, totalBalanceUsd } = useVault();
  const balances = vault?.balances ?? [];

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Assets
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of tokens managed in your Starknet vault
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild size="sm">
            <Link to="/deposit">
              <ArrowDownLeft className="mr-1.5 h-4 w-4" />
              Deposit
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/send">
              <ArrowUpRight className="mr-1.5 h-4 w-4" />
              Send
            </Link>
          </Button>
        </div>
      </div>

      {/* Portfolio Value Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Portfolio Value
          </p>
          <p className="mt-1 font-display text-3xl sm:text-4xl font-extrabold text-foreground">
            {formatUsd(totalBalanceUsd)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Asset valuations based on real-time reference oracles.
          </p>
        </CardContent>
      </Card>

      {/* Assets Breakdown */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Your Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {balances.map((b) => {
            const info = getAssetConfig(b.asset);
            const usdVal = assetToUsd(b.asset, b.amount);
            const percent = totalBalanceUsd > 0 ? (usdVal / totalBalanceUsd) * 100 : 0;

            return (
              <div
                key={b.asset}
                className="flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <TokenIcon symbol={b.asset} className="h-10 w-10 text-base" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-base text-foreground">
                        {b.asset}
                      </span>
                      <span className="text-xs text-muted-foreground">({info.name})</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ref price: {formatUsd(info.referenceUsd)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-base text-foreground">
                      {formatAssetAmount(b.asset, b.amount)} {b.asset}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground sm:justify-end">
                      <span>{formatUsd(usdVal)}</span>
                      <span>•</span>
                      <span>{percent.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                      <Link to={`/send?asset=${b.asset}`}>Send</Link>
                    </Button>
                    <Button asChild size="sm" className="h-8 px-2.5 text-xs">
                      <Link to={`/deposit?asset=${b.asset}`}>Deposit</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
