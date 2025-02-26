import NbreadCard from "@/components/home/NbreadCard";

interface NbreadListProps {
  nbreadList: any[];
  profileImageUrl: string;
}

const NbreadList = ({ nbreadList, profileImageUrl }: NbreadListProps) => {
  return (
    <div className="flex flex-col gap-6">
      {nbreadList.map((nbread, index) => (
        <NbreadCard key={index} nbread={nbread} profileImageUrl={profileImageUrl} />
      ))}
    </div>
  );
};

export default NbreadList;
