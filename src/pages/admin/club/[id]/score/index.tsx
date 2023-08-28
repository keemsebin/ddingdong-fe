import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next/types';
import { useCookies } from 'react-cookie';
import Clean from '@/assets/clean.svg';
import Dot from '@/assets/dot.svg';
import People from '@/assets/people.svg';
import Report from '@/assets/report.svg';
import Report2 from '@/assets/report2.svg';
import Heading from '@/components/common/Heading';
import History from '@/components/common/History';
import Modal from '@/components/common/Modal';
import ScoreCategory from '@/components/common/ScoreCategory';
import CreateScore from '@/components/modal/score/CreateScore';
import { ROLE_TYPE } from '@/constants/text';
import { useAllScore } from '@/hooks/api/score/useAllScore';
import { useMyScore } from '@/hooks/api/score/useMyScore';
import useModal from '@/hooks/common/useModal';
import { ScoreDetail } from '@/types/score';

type ScoreProps = {
  clubId: number;
};
export default function Index({ clubId }: ScoreProps) {
  const key = [
    { icon: Report, category: '동아리 활동 보고서' },
    { icon: Clean, category: '청소' },
    { icon: People, category: '전동대회' },
    { icon: Report2, category: '총동연 사업 참여' },
    { icon: Dot, category: '가산점/감점' },
  ];
  const parseList = [];
  const [{ role, token }] = useCookies(['token', 'role']);
  const [scoreData, setScoreData] = useState<ScoreDetail[]>([
    {
      scoreCategory: '',
      reason: '',
      createdAt: '',
      amount: 0,
      remainingScore: 0,
    },
  ]);
  const [myScoreData, setMyScoreData] = useState<ScoreDetail[]>([]);
  const [mergedScoreData, setMergedScoreData] = useState<ScoreDetail[]>([]);
  const { openModal, visible, closeModal, modalRef } = useModal();
  const {
    data: { data: allData },
  } = useAllScore(token, clubId);
  const [category, setCategory] = useState<string>('');
  const {
    data: { data: myData },
  } = useMyScore(token);

  useEffect(() => {
    if (allData) {
      allData.reverse();
      setScoreData(allData);
    } else if (myData) {
      myData.reverse();
      setScoreData(myData);
    }
  }, [allData, myData]);

  function Category(categoryName: string) {
    const category: ScoreDetail[] = [];
    scoreData.map((item) => {
      if (item.scoreCategory === categoryName) category.push(item);
    });
    const score = totalScore(category);
    parseList.push({ category: category, score: score });
    return category;
  }
  function totalScore(category: Array<ScoreDetail>) {
    const total = category.reduce((acc, cur) => acc + cur.amount, 0);
    return total;
  }
  function handleOpenModal(category: string) {
    setCategory(category);
    openModal();
  }
  const isAdmin = role === ROLE_TYPE.ROLE_ADMIN;

  return (
    <div className="">
      {isAdmin ? (
        <Heading>동아리 점수 관리하기</Heading>
      ) : (
        <Heading>동아리 점수 확인하기</Heading>
      )}
      <History scoreData={scoreData} />
      <div className="mb-3 flex w-full flex-col items-center p-5 md:h-50 md:flex-row md:space-x-5 md:p-4">
        {key.map(({ icon, category }, index) => (
          <div
            key={`category-${index}`}
            onClick={() => handleOpenModal(category)}
            className="mb-5 flex h-20 w-full cursor-pointer justify-between rounded-lg border-2 shadow-md md:mb-0 md:h-full md:max-w-[18%] lg:flex-row"
          >
            <ScoreCategory
              key={category}
              scoreCategory={category}
              icon={icon}
              amount={totalScore(Category(category))}
              clubId={clubId}
              parseList={Category(category)}
            />
          </div>
        ))}
      </div>
      <Modal
        visible={visible}
        modalRef={modalRef}
        title={category}
        closeModal={closeModal}
      >
        <CreateScore
          clubId={clubId}
          scoreCategory={category}
          parseList={Category(category)}
          closeModal={closeModal}
        />
      </Modal>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  return {
    props: {
      clubId: id,
    },
  };
};
