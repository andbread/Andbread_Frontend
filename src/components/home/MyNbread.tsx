import MyNbreadList from "@/components/home/MyNbreadList";
import AddLogButton from "@/components/home/AddLogButton";
interface MyNbreadProps {
  nbreadList: any[];
  profileImageUrl: string;
}

const MyNbread = ({ nbreadList, profileImageUrl }: MyNbreadProps) => {
  return (
    <section className="mt-40">
      <h2 className="text-heading04 font-bold mb-24 text-gray-800">
        나의 엔빵
        {nbreadList.length > 0 && (
          <span className="text-secondary-200 ml-6 text-heading05">{nbreadList.length}개</span>
        )}
      </h2>
      <AddLogButton />
      <MyNbreadList nbreadList={nbreadList} profileImageUrl={profileImageUrl} />
    </section>
  );
};

export default MyNbread;
