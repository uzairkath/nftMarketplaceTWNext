import { Contract, ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { address, abi } from "../config.js";

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  const web3modalRef = useRef();

  useEffect(() => {
    web3modalRef.current = new Web3Modal({
      network: "mumbai",
      providerOptions: {},
      disableInjectedProvider: false,
    });
    loadNfts();
  }, []);
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3modalRef.current.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    console.log(chainId);
    if (chainId !== 80001) {
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
        // const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          //   image: meta.data.image,
          //   name: meta.data.name,
          //   description: meta.data.description,
        };
        return item;
      })
    );
    setNfts(items);
    setLoadingState("loaded");
  };

  const buyNfts = async nft => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(address, abi, signer);
    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");
    const transaction = await contract.createMarketSale(nft.tokenId, {
      value: price,
    });
    await transaction.wait();
    loadNfts();
  };
  if (loadingState === "loaded" && !nfts.length)
    return <h1 className="px-20 `py-10 text-3xl ">No items in marketplace</h1>;
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, i) => {
            <div key={i} className="border shadow rounded-xl overflow-hidden">
              <img src={nft.image} />
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-2xl font-semibold"
                >
                  {nft.name}
                </p>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p className="text-gray-400">{nft.description}</p>
                </div>
              </div>
              <div className="p-4 bg-black">
                <p className="text-2xl mb-4 font-bold text-white">
                  {nft.price} Matic
                </p>
                <button
                  onClick={() => buyNfts(nft)}
                  className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                >
                  Buy
                </button>
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}