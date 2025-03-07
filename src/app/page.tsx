import Icon from '@/components/common/icon/Icon'

export default function Page() {
  return (
    <div>
      <h1>heading-01 24px</h1>
      <h2>heading-02 20px</h2>
      <h3>heading-03 18px</h3>
      <h4>heading-04 16px</h4>
      <h5>heading-05 14px</h5>
      <hr className="my-24"></hr>
      <p className="text-body01">body-01 16px</p>
      <p className="text-body02">body-02 14px</p>
      <p className="text-body03">body-03 12px</p>
      <p className="text-body04">body-04 11px</p>
      <p className="text-body05">body-05 10px</p>
      <p className="text-body06">body-06 8px</p>
      <hr className="my-24"></hr>
      <div className="row-1 flex pb-12">
        <div className="bg-primary-500 p-8 text-body03">primary-500</div>
        <div className="bg-primary-400 p-8 text-body03">primary-400</div>
        <div className="bg-primary-300 p-8 text-body03">primary-300</div>
        <div className="bg-primary-200 p-8 text-body03">primary-200</div>
        <div className="bg-primary-100 p-8 text-body03">primary-100</div>
      </div>
      <div className="rows-1 flex pb-12">
        <div className="bg-secondary-300 p-8 text-body03">secondary-300</div>
        <div className="bg-secondary-200 p-8 text-body03">secondary-200</div>
        <div className="bg-secondary-100 p-8 text-body03">secondary-100</div>
      </div>
      <div className="rows-1 flex">
        <div className="bg-system-red01 p-8 text-body03">system-red</div>
        <div className="bg-system-blue01 p-8 text-body03">system-blue</div>
        <div className="bg-system-yellow p-8 text-body03">system-yellow</div>
        <div className="bg-system-green p-8 text-body03">system-green</div>
      </div>
      <hr className="my-24"></hr>
      <div className="card">default card style</div>
      <hr className="my-24"></hr>
      <div className="columns-1 pb-24">
        <button className="btn btn-large btn-primary">large primary</button>
        <button className="btn btn-large btn-secondary">large secondary</button>
        <button className="btn btn-large btn-warning">large warning</button>
      </div>
      <div className="columns-1 pb-24">
        <button className="btn btn-medium btn-primary">medium primary</button>
        <button className="btn btn-medium btn-secondary">
          medium secondary
        </button>
      </div>
      <div className="columns-1">
        <button className="btn btn-small btn-primary">small primary</button>
        <button className="btn btn-small btn-secondary">small secondary</button>
      </div>
      <hr className="my-24"></hr>
      <div className="columns-12">
        <Icon
          type="angleLeft"
          width={16}
          height={16}
          fill="text-gray-600"
        ></Icon>
        <Icon
          type="angleRight"
          width={16}
          height={16}
          fill="text-gray-600"
        ></Icon>
        <Icon type="badge" width={16} height={16} fill="text-gray-600"></Icon>
        <Icon
          type="calendar"
          width={16}
          height={16}
          fill="text-gray-600"
        ></Icon>
        <Icon type="check" width={16} height={16} fill="text-gray-600"></Icon>
        <Icon type="copy" width={16} height={16} fill="text-gray-600"></Icon>
        <Icon type="crossFill" width={16} height={16}></Icon>
        <Icon type="cross" width={16} height={16} fill="text-gray-600"></Icon>
        <Icon
          type="googleLogo"
          width={16}
          height={16}
          fill="text-gray-600"
        ></Icon>
        <Icon
          type="kakaoLogo"
          width={16}
          height={16}
          fill="text-gray-600"
        ></Icon>
        <Icon type="plus" width={16} height={16} fill="text-gray-600"></Icon>
        <Icon type="warning" width={16} height={16} fill="text-gray-600"></Icon>
      </div>
    </div>
  )
}
