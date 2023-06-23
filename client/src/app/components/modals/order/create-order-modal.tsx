import React, { useEffect, useState, useContext } from "react";
import { Typography, TextField, Modal, Checkbox, Button, FormLabel, IconButton, Stepper, Step, StepLabel } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { IOrderCreateForm } from "../../../types/order";
import { IApplicationData } from "../../../types/application";
import { OrderListContext } from "../../service-center-management/context/order-list-context";
import { AlertContext } from "../../../helpers/alert/context/alert-context";
import orderService from "../../../services/order-service";
import "../styles.scss";

type PropTypes = {
  isOpened: boolean,
  setIsOpened: React.Dispatch<React.SetStateAction<boolean>>,
  application: IApplicationData | null
}

const CreateOrderModal = (props: PropTypes) => {
  const [ deliveryToServiceCenter, setDeliveryToServiceCenter ] = useState<boolean>(false);
  const [ deliveryFromServiceCenter, setDeliveryFromServiceCenter ] = useState<boolean>(false);
  const [ activeStep, setActiveStep ] = useState<number>(0);
  const [ errorStepSet, setErrorStepSet ] = useState<Set<number>>(new Set<number>());
  const steps = [ "Контактні дані", "Дані робіт" ];

  const orderList = useContext(OrderListContext);
  const alert = useContext(AlertContext);

  useEffect(() => {
    if (props.application) {
      setDeliveryToServiceCenter(props.application.deliveryToServiceCenter);
      setDeliveryFromServiceCenter(props.application.deliveryFromServiceCenter);
      setActiveStep(0);
    }
  }, [ props.application ]);

  const handleClose = () => {
    props.setIsOpened(!props.isOpened);
  };

  const handleDeliveryToServiceCenterChange = () => {
    setDeliveryToServiceCenter(!deliveryToServiceCenter);
  };

  const handleDeliveryFromServiceCenterChange = () => {
    setDeliveryFromServiceCenter(!deliveryFromServiceCenter);
  };

  const validationSchema = Yup.object().shape({
    lastName: Yup.string().required("Прізвище є бов'язковим полем"),
    firstName: Yup.string().required("Ім'я є бов'язковим полем"),
    middleName: Yup.string(),
    email: Yup.string().email().required("Email є бов'язковим полем"),
    phone: Yup.string().required("Телефон є бов'язковим полем"),
    objectType: Yup.string().required("Об'єкт є бов'язковим полем"),
    model: Yup.string(),
    deliveryToServiceCenter: Yup.boolean(),
    deliveryFromServiceCenter: Yup.boolean(),
    price: Yup.number().min(0).required("Вартість є бов'язковим полем"),
    address: Yup.string()
      .when("deliveryFromServiceCenter", {
        is: true,
        then: (schema) => schema.required("Адреса є бов'язковим полем")
      }),
    description: Yup.string().required("Опис є бов'язковим полем")
  });

  const {
    register,
    handleSubmit,
    trigger,
    getFieldState,
    formState: { errors }
  } = useForm<IOrderCreateForm>({
    resolver: yupResolver(validationSchema)
  });

  const validateStep1 = async () => {
    const fields: Array<"lastName" | "firstName" | "email" | "phone"> = [ "lastName", "firstName", "email", "phone" ];
    await trigger(fields);
    if(fields.some(field => getFieldState(field).error)) {
      setErrorStepSet(new Set<number>([ ...Array.from(errorStepSet), activeStep ]));
    } else if (errorStepSet.has(activeStep)) {
      errorStepSet.delete(activeStep);
    }
  };

  const validateStep2 = async () => {
    const fields: Array<"objectType" | "address" | "description" | "price" | "plannedDateCompleted" > = [ "objectType", "address", "description", "price", "plannedDateCompleted" ];
    await trigger(fields);
    if(fields.some(field => getFieldState(field).error)) {
      setErrorStepSet(new Set<number>([ ...Array.from(errorStepSet), activeStep ]));
    } else if (errorStepSet.has(activeStep)) {
      errorStepSet.delete(activeStep);
    }
  };

  const handleNext = async () => {
    await validateStep1();
    setActiveStep(activeStep + 1);
  };

  const handleBack = async () => {
    await validateStep2();
    setActiveStep(activeStep - 1);
  };

  const onSubmit = (data: IOrderCreateForm) => {
    data.deliveryToServiceCenter = deliveryToServiceCenter;
    data.deliveryFromServiceCenter =deliveryFromServiceCenter;
    data.clientId = props.application?.clientId || null;
    data.applicationId = props.application?.id || null;
    if (orderList) {
      orderList?.createOrder(data, handleClose);
    } else {
      const jwtToken: string | null = localStorage.getItem("jwtToken");
      if (jwtToken) {
        orderService.createOrder(data, jwtToken)
          .then(() => {
            alert?.showAlertMessage("Замовлення було успішно створено", true);
            handleClose();
          })
          .catch(e => {
            alert?.showAlertMessage(e.response.data.message, false);
          });
      }
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
    case 0:
      return (
        <div className="form-data">
          <div key="lastName">
            <TextField
              id="lastName"
              label="Прізвище" 
              type="text" 
              size="small" 
              variant="standard"
              defaultValue={props.application?.lastName}
              required
              className="text-field" 
              {...register("lastName")}
              error={errors.lastName ? true : false}
            />
            <Typography variant="body2" color="error" fontSize={12}>
              { errors.lastName?.message?.toString() }
            </Typography>
          </div>
          <div key="firstName">
            <TextField
              id="firstName"
              label="Ім'я" 
              type="text" 
              size="small" 
              variant="standard" 
              defaultValue={props.application?.firstName}
              required
              className="text-field" 
              {...register("firstName")}
              error={errors.firstName ? true : false}
            />
            <Typography variant="body2" color="error" fontSize={12}>
              { errors.firstName?.message?.toString() }
            </Typography>
          </div>
          <div key="middleName">
            <TextField 
              id="middleName"
              label="По батькові" 
              type="text" 
              size="small" 
              variant="standard" 
              defaultValue={props.application?.middleName}
              className="text-field" 
              {...register("middleName")}
              error={errors.middleName ? true : false}
            />
            <Typography variant="body2" color="error" fontSize={12}>
              { errors.middleName?.message?.toString() }
            </Typography>
          </div>
          <div key="email">
            <TextField 
              id="email"
              label="Email" 
              type="email" 
              size="small" 
              variant="standard" 
              defaultValue={props.application?.email}
              required
              className="text-field" 
              {...register("email")}
              error={errors.email ? true : false}
            />
            <Typography variant="body2" color="error" fontSize={12}>
              { errors.email?.message?.toString() }
            </Typography>
          </div>
          <div key="phone">
            <TextField 
              id="phone"
              label="Телефон" 
              type="text" 
              size="small" 
              variant="standard" 
              defaultValue={props.application?.phone}
              required
              className="text-field" 
              {...register("phone")}
              error={errors.phone ? true : false}
            />
            <Typography variant="body2" color="error" fontSize={12}>
              { errors.phone?.message?.toString() }
            </Typography>
          </div>
        </div>
      ); 
    case 1:
      return (
        <div className="form-data">
          <div key="objectType">
            <TextField 
              id="objectType"
              label="Тип об'єкту" 
              type="text" 
              size="small" 
              variant="standard"
              defaultValue={props.application?.objectType}
              required
              className="text-field" 
              {...register("objectType")}
              error={errors.objectType ? true : false}
            />
            <Typography variant="body2" color="error" fontSize={12}>
              { errors.objectType?.message?.toString() }
            </Typography>
          </div>
          <TextField 
            id="model"
            label="Модель" 
            type="text" 
            size="small" 
            variant="standard" 
            className="text-field"
            defaultValue={props.application?.model}
            {...register("model")}
          />
          <div className="checkbox-field">
            <div>
              <Checkbox id="deliveryTo" value={deliveryToServiceCenter} checked={deliveryToServiceCenter} onChange={handleDeliveryToServiceCenterChange} />
              <FormLabel>Потрібна доставка в сервісний центр</FormLabel>
            </div>
            <div>
              <Checkbox id="deliveryFrom" value={deliveryFromServiceCenter} checked={deliveryFromServiceCenter} onChange={handleDeliveryFromServiceCenterChange} />
              <FormLabel>Потрібна доставка з сервісного центру</FormLabel>
            </div>
          </div>
          { (deliveryToServiceCenter || deliveryFromServiceCenter) &&
          <div key="address">
            <TextField
              id="address"
              label="Ваша адреса" 
              type="text" 
              size="small" 
              variant="standard" 
              defaultValue={props.application?.address}
              required
              className="text-field"
              {...register("address")}
              error={errors.address ? true : false}
            />
            <Typography variant="body2" color="error" fontSize={12}>
              { errors.address?.message?.toString() }
            </Typography>
          </div>
          }
          <div key="plannedDateCompleted">
            <TextField 
              id="plannedDateCompleted" 
              type="date"
              label="Запланована дата завершення"
              size="small" 
              variant="standard"  
              className="text-field"
              InputLabelProps={{ shrink: true }}
              {...register("plannedDateCompleted")}
              error={errors.plannedDateCompleted ? true : false}
            />
            <Typography variant="body2" color="error" fontSize={12}>
              { errors.plannedDateCompleted?.message?.toString() }
            </Typography>
          </div>
          <div key="price">
            <TextField 
              id="price"
              label="Вартість (грн)" 
              type="text" 
              size="small" 
              variant="standard"
              required
              className="text-field" 
              {...register("price")}
              error={errors.price ? true : false}
            />
            <Typography variant="body2" color="error" fontSize={12}>
              { errors.price?.message?.toString() }
            </Typography>
          </div>
          <div key="description">
            <TextField  
              id="description"
              label="Опис" 
              type="text"
              size="small" 
              variant="outlined" 
              multiline 
              minRows={3} 
              maxRows={10} 
              defaultValue={props.application?.description}
              required
              className="multiline-text-field" 
              {...register("description")}
              error={errors.description ? true : false}
            />
            <Typography variant="body2" color="error" fontSize={12}>
              { errors.description?.message?.toString() }
            </Typography>
          </div>
        </div>
      );            
    default:
      return "Unknown step";
    }
  };

  return (
    <Modal open={props.isOpened} keepMounted={false}>
      <div className="modal">
        <IconButton onClick={handleClose} className="close-icon">
          <CloseIcon />
        </IconButton>
        <Typography variant="h5" className="title">Створення замовлення</Typography>
        { props.application && <Typography variant="h5" className="title">{ `для заяви № ${props.application.number}` }</Typography> }
        <Stepper activeStep={activeStep}>
          { steps.map((label, index) =>(
            <Step key={index}>
              <StepLabel error={errorStepSet.has(index)}>{ label }</StepLabel>
            </Step>
          )) }
        </Stepper>
        { getStepContent(activeStep) }
        <div className="modal-buttons">
          { activeStep > 0 && <Button id="back" variant="outlined" className="button" onClick={handleBack}>Назад</Button> }      
          { activeStep < steps.length - 1 ? 
            <Button id="next" variant="contained" className="button" onClick={handleNext}>Далі</Button> :        
            <Button id="create" variant="contained" onClick={handleSubmit(onSubmit)} className="button">Створити</Button> 
          }        
        </div>
      </div>
    </Modal>
  ); 
};

export default CreateOrderModal;