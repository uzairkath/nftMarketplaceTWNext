import { Contract, ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { address, abi } from "../config.js";

export default function CreatorDashboard() {
  const [nfts, setNfts] = useState([]);
  const [sold, setSold] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  const web3modalRef = useRef();

  useEffect(() => {
    web3modalRef.current = new Web3Modal({
      network: "rinkeby",
      providerOptions: {},
      disableInjectionProvider: false,
    });
    loadNfts();
  }, []);
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3modalRef.current.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    console.log(chainId);
    if (chainId !== 4) {
      alert("Connect to Mumbai Test Network");
      throw new Error("Connect to Mumbai Test Network");
    }
    if (needSigner == true) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };
  const loadNfts = async () => {
    const signer = await getProviderOrSigner(true);
    console.log(signer);
    console.log(address);
    const contract = new ethers.Contract(address, abi, signer);
    console.log(contract);
    // const data = await contract.ownerOf(1);
    const data = await contract.fetchMarketItems();
    console.log(data);
    const items = await Promise.all(
      data.map(async i => {
        const tokenUri = await contract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          sold: i.sold,
          image: meta.data.image,
        };
        return item;
      })
    );
    const soldItems = items.filter(i => i.sold);
    setSold(soldItems);
    setNfts(items);
    setLoadingState("loaded");
  };
  return (
    <div>
      <div className="p-4">
        <h2 className="text-2xl py-2">Items Created</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, i) => (
            <div key={i} className="border shadow rounded-xl overflow-hidden">
              <img src={nft.image} className="rounded" />
              <div className="p-4 bg-orange-300">
                <p className="text-2xl font-bold text-white">
                  Price - {nft.price} Matic
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4">
        {Boolean(sold.length) && (
          <div>
            <h2 className="text-2xl py-2">Items Sold</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {sold.map((nft, i) => (
                <div
                  key={i}
                  className="border shadow rounded-xl overflow-hidden"
                >
                  <img src={nft.image} className="rounded" />
                  <div className="p-4 bg-black">
                    <p className="text-2xl font-bold text-white">
                      Price - {nft.price} Matic
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
