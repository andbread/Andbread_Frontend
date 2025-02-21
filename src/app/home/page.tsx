import Header from "@/components/home/Header";
import EmptyLog from "@/components/home/Emptylog";
import AddLogButton from "@/components/home/AddLogButton";

const HomePage = () => {
  return (
    <div className="flex flex-col justify-between p-24 pt-16">
      <Header /> 
      <main className="p-4 mt-24">
        <section>
          <h2 className="text-lg font-bold mb-24 text-[#333036]">이번 달 엔빵</h2>
          <EmptyLog />
        </section>

        <section className="mt-40">
          <h2 className="text-lg font-bold mb-24 text-[#333036]">나의 엔빵</h2>
          <AddLogButton/>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
