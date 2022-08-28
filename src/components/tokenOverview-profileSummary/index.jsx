import ProfileSummary from "./Profile-Summary";
import { OverviewSection } from "./styles";
import TokenOverview from "./Token-overview";

const Summary = (props) => {
  return (
    <OverviewSection>
      {props.x}
      <TokenOverview
        price={`$ ${props.tokenOverview.tokenUSDPrice === undefined ? 0 : props.tokenOverview.tokenUSDPrice}`}
        marketCap={`$ ${props.tokenOverview.marketCap === undefined ? 0 : props.tokenOverview.marketCap}`}
        totalSupply={props?.totalSupply}
        symbol={props.token?.attributes?.symbol}
        ownerTokenInUSD={`$ ${props?.owner?.tokenInUSD === undefined ? 0 : props?.owner?.tokenInUSD}`}
        ownerTokenAmount={props?.owner?.tokenAmount}
        title="Token Overview"
        holders={`$ ${props.tokenOverview.holderCap === undefined ? 0 : props.tokenOverview.holderCap}`}
      />
      <ProfileSummary
        contract={props.token?.attributes?.address}
        title="Profile Summary"
        website={"cliet_input"}
        support={"trixie@support.com"}
      />
    </OverviewSection>
  );
};

export default Summary;
