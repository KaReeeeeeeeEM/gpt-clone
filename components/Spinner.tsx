import Image from "next/image";
import React from "react";

const Spinner = () => {
  return (
    <Image
      alt="spinner-icon"
      src="/spinner.png"
      width="20"
      height="20"
      className="animate-spin"
    />
  );
};

export default Spinner;
